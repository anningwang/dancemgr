# -*- coding:utf-8 -*-
from flask import render_template, flash, redirect, session, url_for, request, g, jsonify, json
from flask_login import login_user, logout_user, current_user, login_required
from flask_sqlalchemy import get_debug_queries
from flask_babel import gettext
from app import app, db, lm, oid, babel
from forms import LoginForm, EditForm, PostForm, SearchForm, DanceLoginForm, DanceRegistrationForm
from models import User, ROLE_USER, ROLE_ADMIN, Post, HzLocation, DanceStudent, DanceClass, DanceSchool, DanceUser,\
    DanceStudentClass
from datetime import datetime
from emails import follower_notification
from guess_language import guessLanguage
from translate import microsoft_translate
from config import POSTS_PER_PAGE, MAX_SEARCH_RESULTS, LANGUAGES, DATABASE_QUERY_TIMEOUT
import random
from dijkstra import min_dist2, get_nearest_vertex, hz_vertex
from app.tools.upload import *


@lm.user_loader
def load_user(uid):
    return DanceUser.query.get(int(uid))


@babel.localeselector
def get_locale():
    return request.accept_languages.best_match(LANGUAGES.keys())


@app.before_request
def before_request():
    g.user = current_user
    if g.user.is_authenticated:
        # g.user.last_seen = datetime.utcnow()
        # db.session.add(g.user)
        # db.session.commit()
        g.search_form = SearchForm()
    g.locale = get_locale()


@app.after_request
def after_request(response):
    for query in get_debug_queries():
        if query.duration >= DATABASE_QUERY_TIMEOUT:
            app.logger.warning("SLOW QUERY: %s\nParameters: %s\nDuration: %fs\nContext: %s\n" % (
                query.statement, query.parameters, query.duration, query.context))
    return response


@app.errorhandler(404)
def internal_error(error):
    return render_template('404.html'), 404


@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return render_template('500.html'), 500


@app.route('/', methods=['GET', 'POST'])
@app.route('/index', methods=['GET', 'POST'])
@login_required
def index():
    return render_template('index.html',
                           title='Home')

'''
@app.route('/', methods=['GET', 'POST'])
@app.route('/index', methods=['GET', 'POST'])
@app.route('/index/<int:page>', methods=['GET', 'POST'])
@login_required
def index(page=1):
    form = PostForm()
    if form.validate_on_submit():
        language = guessLanguage(form.post.data)
        if language == 'UNKNOWN' or len(language) > 5:
            language = ''
        post = Post(body=form.post.data,
                    timestamp=datetime.utcnow(),
                    author=g.user,
                    language=language)
        db.session.add(post)
        db.session.commit()
        flash(gettext('Your post is now live!'))
        return redirect(url_for('index'))
    g.user.followed_posts()
    posts = g.user.followed_posts().paginate(page, POSTS_PER_PAGE, False)
    return render_template('index.html',
                           title='Home',
                           form=form,
                           posts=posts)
'''


@app.route('/login', methods=['GET', 'POST'])
def login():
    if g.user is not None and g.user.is_authenticated:
        return redirect(url_for('index'))

    form = DanceLoginForm()
    user_dc = DanceUser.query.filter_by(name=form.username.data).first()
    if form.validate_on_submit():
        if user_dc is not None and user_dc.check_password(form.password.data):
            if user_dc.check_logged():
                flash(u'用户[%s]已经登录!' % user_dc.name)
            else:
                user_dc.login()
                login_user(user_dc, remember=form.remember_me.data)
                return redirect(request.args.get('next') or url_for('index'))
        else:
            flash(u'用户名或者密码错误！')
    else:
        print form.errors

    return render_template('login.html', form=form,
                           username='' if form.username.data is None else form.username.data)

'''
@app.route('/login', methods=['GET', 'POST'])
@oid.loginhandler
def login():
    if g.user is not None and g.user.is_authenticated:
        return redirect(url_for('index'))
    form = LoginForm()
    if form.validate_on_submit():
        session['remember_me'] = form.remember_me.data
        return oid.try_login(form.openid.data, ask_for=['nickname', 'email'])
    return render_template('login.html',
                           title='Sign In',
                           form=form,
                           providers=app.config['OPENID_PROVIDERS'])
'''

@oid.after_login
def after_login(resp):
    if resp.email is None or resp.email == "":
        flash(gettext('Invalid login. Please try again.'))
        return redirect(url_for('login'))
    username = User.query.filter_by(email=resp.email).first()
    if username is None:
        nickname = resp.nickname
        if nickname is None or nickname == "":
            nickname = resp.email.split('@')[0]
        nickname = User.make_valid_nickname(nickname)
        nickname = User.make_unique_nickname(nickname)
        username = User(nickname=nickname, email=resp.email, role=ROLE_USER)
        db.session.add(username)
        db.session.commit()
        # make the user follow him/herself
        db.session.add(user.follow(username))
        db.session.commit()
    remember_me = False
    if 'remember_me' in session:
        remember_me = session['remember_me']
        session.pop('remember_me', None)
    login_user(username, remember=remember_me)
    return redirect(request.args.get('next') or url_for('index'))


@app.route('/logout')
def logout():
    g.user.logout()
    logout_user()
    return redirect(url_for('index'))


@app.route('/register', methods=['GET', 'POST'])
def register():
    form = DanceRegistrationForm()
    if request.method == 'POST' and form.validate():
        user_dc = DanceUser(form.username.data, form.email.data, form.password.data, form.company.data)
        db.session.add(user_dc)
        db.session.commit()
        flash('Thanks for registering')
        return redirect(url_for('login'))
    else:
        print form.errors

    return render_template('register.html', form=form)        # dance_register


@app.route('/user/<nickname>')
@app.route('/user/<nickname>/<int:page>')
@login_required
def user(nickname, page=1):
    username = User.query.filter_by(nickname=nickname).first()
    if username is None:
        flash(gettext('User %(nickname)s not found.', nickname=nickname))
        return redirect(url_for('index'))
    posts = username.posts.paginate(page, POSTS_PER_PAGE, False)
    return render_template('user.html', user=username, posts=posts)


@app.route('/edit', methods=['GET', 'POST'])
@login_required
def edit():
    form = EditForm(g.user.nickname)
    if form.validate_on_submit():
        g.user.nickname = form.nickname.data
        g.user.about_me = form.about_me.data
        db.session.add(g.user)
        db.session.commit()
        flash(gettext('Your changes have been saved.'))
        return redirect(url_for('edit'))
    elif request.method != "POST":
        form.nickname.data = g.user.nickname
        form.about_me.data = g.user.about_me
    return render_template('edit.html', form=form)


@app.route('/follow/<nickname>')
@login_required
def follow(nickname):
    username = User.query.filter_by(nickname=nickname).first()
    if username is None:
        flash('User ' + nickname + ' not found.')
        return redirect(url_for('index'))
    if username == g.user:
        flash(gettext('You can\'t follow yourself!'))
        return redirect(url_for('user', nickname=nickname))
    u = g.user.follow(username)
    if u is None:
        flash(gettext('Cannot follow %(nickname)s.', nickname=nickname))
        return redirect(url_for('user', nickname=nickname))
    db.session.add(u)
    db.session.commit()
    flash(gettext('You are now following %(nickname)s!', nickname=nickname))
    follower_notification(username, g.user)
    return redirect(url_for('user', nickname=nickname))


@app.route('/unfollow/<nickname>')
@login_required
def unfollow(nickname):
    username = User.query.filter_by(nickname=nickname).first()
    if username is None:
        flash('User ' + nickname + ' not found.')
        return redirect(url_for('index'))
    if username == g.user:
        flash(gettext('You can\'t unfollow yourself!'))
        return redirect(url_for('user', nickname=nickname))
    u = g.user.unfollow(username)
    if u is None:
        flash(gettext('Cannot unfollow %(nickname)s.', nickname=nickname))
        return redirect(url_for('user', nickname=nickname))
    db.session.add(u)
    db.session.commit()
    flash(gettext('You have stopped following %(nickname)s.', nickname=nickname))
    return redirect(url_for('user', nickname=nickname))


@app.route('/delete/<int:pid>')
@login_required
def delete(pid):
    post = Post.query.get(pid)
    if post is None:
        flash('Post not found.')
        return redirect(url_for('index'))
    if post.author.id != g.user.id:
        flash('You cannot delete this post.')
        return redirect(url_for('index'))
    db.session.delete(post)
    db.session.commit()
    flash('Your post has been deleted.')
    return redirect(url_for('index'))


@app.route('/search', methods=['POST'])
@login_required
def search():
    if not g.search_form.validate_on_submit():
        return redirect(url_for('index'))
    return redirect(url_for('search_results', query=g.search_form.search.data))


@app.route('/search_results/<query>')
@login_required
def search_results(query):
    results = Post.query.whoosh_search(query, MAX_SEARCH_RESULTS).all()
    return render_template('search_results.html',
                           query=query,
                           results=results)


@app.route('/translate', methods=['POST'])
@login_required
def translate():
    return jsonify({
        'text': microsoft_translate(
            request.form['text'],
            request.form['sourceLang'],
            request.form['destLang'])})


# JoySuch get Token
@app.route('/token', methods=['POST', 'GET'])
@login_required
def gettoken():
    return render_template('index.html')


@app.route('/show_all_users', methods=['POST', 'GET'])
@login_required
def show_all_users():
    users = User.query.all()
    return render_template('show_all_users.html', users=users)


@app.route('/get_location', methods=['POST'])
def get_pos():
    user_id = request.form['userId']
    ret_loc = []
    hz_location = HzLocation.query.group_by(HzLocation.user_id)
    for loc in hz_location:  # 如果存在，则获取最新的一个坐标
        ret_loc.append({'userId': loc.user_id, 'x': loc.x, 'y': loc.y})

    # print ret_loc
    return jsonify(ret_loc)


@app.route('/go', methods=['POST'])
def get_path():
    location = int(request.form['location'])
    user_id = request.form['userId']
    px = py = 0

    points = []
    hz_location = HzLocation.query.group_by(HzLocation.user_id)
    for loc in hz_location:  # 如果存在，则获取最新的一个坐标
        if user_id == loc.user_id:
            px = loc.x
            py = loc.y
        points.append({'userId': loc.user_id, 'x': loc.x, 'y': loc.y})

    pt_from = get_nearest_vertex(px, py)
    path = min_dist2(pt_from, location)
    print path

    ret = []
    for p in path:
        ret.append(hz_vertex[p])

    ret_loc_with_path = {'x': px, 'y': py, 'path': ret, 'points': points}
    return jsonify(ret_loc_with_path)


@app.route('/dance_location_get', methods=['POST'])
def dance_location_get():
    page_size = int(request.form['pageSize'])
    page_no = int(request.form['pageNo'])
    if page_no <= 0:
        page_no = 1
    rows = []
    total = HzLocation.query.count()
    offset = (page_no - 1) * page_size
    hz_location = HzLocation.query.order_by(HzLocation.id.desc()).limit(page_size).offset(offset)
    # hz_location = HzLocation.query.all()
    # hz_location = HzLocation.query.limit(100)
    i = offset + 1
    for loc in hz_location:
        rows.append({"id": loc.id, "build_id": loc.build_id, "floor_no": loc.floor_no,
                     "user_id": loc.user_id, "x": loc.x, "y": loc.y,
                     "timestamp": loc.timestamp, 'no': i})
        i += 1
    return jsonify({"total": total, "rows": rows})


@app.route('/dance_student_get', methods=['POST', 'GET'])
def dance_student_get():
    page_size = int(request.form['rows'])
    page_no = int(request.form['page'])
    if 'condition' in request.form:
        condition = request.form['condition']
    else:
        condition = ''

    print 'page_size=', page_size, ' page_no=', page_no
    if page_no <= 0:    # 补丁
        page_no = 1
    rows = []
    if condition == '':
        total = DanceStudent.query.count()
    else:
        total = DanceStudent.query.filter(DanceStudent.name.like('%' + condition + '%')).count()

    offset = (page_no - 1) * page_size
    records = DanceStudent.query.order_by(
        DanceStudent.id.desc()).filter(
        DanceStudent.name.like('%' + condition + '%')).limit(page_size).offset(offset)
    i = offset + 1
    for r in records:
        rows.append({"id": r.id, "sno": r.sno, "school_no": r.school_no,
                     "school_name": r.school_name, "consult_no": r.consult_no, "name": r.name,
                     "rem_code": r.rem_code, 'no': i, 'gender': r.gender,
                     'degree': r.degree, 'birthday': r.birthday,
                     'register_day': datetime.strftime(r.register_day, '%Y-%m-%d'),
                     'information_source': r.information_source,
                     'counselor': r.counselor, 'reading_school': r.reading_school,
                     'grade': r.grade, 'phone': r.phone, 'tel': r.tel,
                     'address': r.address, 'zipcode': r.zipcode, 'email': r.email,
                     'qq': r.qq, 'wechat': r.wechat, 'mother_name': r.mother_name,
                     'father_name': r.father_name, 'mother_phone': r.mother_phone,
                     'father_phone': r.father_phone, 'mother_tel': r.mother_tel, 'father_tel': r.father_tel,
                     'mother_company': r.mother_company, 'father_company': r.father_company,
                     'card': r.card,
                     'is_training': r.is_training,
                     'points': r.points,
                     'remark': r.remark, 'recorder': r.recorder,
                     'idcard': r.idcard, 'mother_wechat': r.mother_wechat,'father_wechat':r.father_wechat
                     })
        i += 1
    return jsonify({"total": total, "rows": rows})


@app.route('/dance_class_student_condition_get', methods=['POST', 'GET'])
def dance_class_student_condition_get():
    # page_size = int(request.form['rows'])
    # page_no = int(request.form['page'])
    cno = request.form['cno']

    rows = []
    records = DanceStudent.query.join(DanceStudentClass, DanceStudentClass.student_id == DanceStudent.sno).filter(
        DanceStudentClass.class_id == cno, DanceStudent.is_training == u'是').all()

    total = len(records)
    i = 1
    for r in records:
        rows.append({"id": r.id, "sno": r.sno, "school_no": r.school_no,
                     "school_name": r.school_name, "consult_no": r.consult_no, "name": r.name,
                     "rem_code": r.rem_code, 'no': i, 'gender': r.gender,
                     'degree': r.degree, 'birthday': r.birthday,
                     'register_day': datetime.strftime(r.register_day, '%Y-%m-%d'),
                     'information_source': r.information_source,
                     'counselor': r.counselor, 'reading_school': r.reading_school,
                     'grade': r.grade, 'phone': r.phone, 'tel': r.tel,
                     'address': r.address, 'zipcode': r.zipcode, 'email': r.email,
                     'qq': r.qq, 'wechat': r.wechat, 'mother_name': r.mother_name,
                     'father_name': r.father_name, 'mother_phone': r.mother_phone,
                     'father_phone': r.father_phone, 'mother_tel': r.mother_tel, 'father_tel': r.father_tel,
                     'mother_company': r.mother_company, 'father_company': r.father_company,
                     'card': r.card,
                     'is_training': r.is_training,
                     'points': r.points,
                     'remark': r.remark, 'recorder': r.recorder,
                     'idcard': r.idcard, 'mother_wechat': r.mother_wechat,'father_wechat':r.father_wechat
                     })
        i += 1
    return jsonify({"total": total, "rows": rows, 'errorCode': 0, 'msg': 'ok'})


@app.route('/dance_student_query', methods=['POST'])
def dance_student_query():
    json_data = request.form['condition']

    ret = []
    records = DanceStudent.query.order_by(
        DanceStudent.id.desc()).filter(DanceStudent.name.like('%'+json_data + '%'))
    for rec in records:
        ret.append({'value': rec.name, 'text': rec.name})

    return jsonify(ret)


@app.route('/dance_del_data', methods=['POST'])
def dance_del_data():
    # if request.has_key('ids'):
    who = request.form['who']
    ids = request.form.getlist('ids[]')
    print 'who=', who, ' ids=', ids

    if who == 'DanceClass':
        table = DanceClass
    elif who == 'DanceStudent':
        table = DanceStudent
    elif who == 'DanceSchool':
        table = DanceSchool
    elif who == 'DanceUser':
        table = DanceUser
    else:
        return jsonify({'errorCode': 1, "msg": "Table not found!"})     # error

    for i in ids:
        db.session.delete(table.query.get(i))
    db.session.commit()

    return jsonify({'errorCode': 0, "msg": "Ok for del."})


@app.route('/dance_student_get_details', methods=['POST', 'GET'])
def dance_student_get_details():
    sno = int(request.form['sno'])
    page_size = 1
    page_no = int(request.form['page'])
    print 'page_size=', page_size, ' page_no=', page_no
    if page_no == -1 or page_no == 0:  # 补丁
        page_no = 1

    if page_no <= -2:
        # 根据 sno 获取学生详细信息，并求出其序号。
        r = DanceStudent.query.get(sno)
        if r is None:
            return jsonify({'errorCode': 400, 'msg': u'不存在学号为[%s]的学员！' % sno})
        i = DanceStudent.query.order_by(
            DanceStudent.id.desc()).filter(DanceStudent.id >= r.id).count()
    else:
        offset = (page_no - 1) * page_size
        r = DanceStudent.query.order_by(DanceStudent.id.desc()).limit(page_size).offset(offset).first()
        i = offset + 1

    total = DanceStudent.query.count()

    rows = [{"id": r.id, "sno": r.sno, "school_no": r.school_no, "school_name": r.school_name,
             "consult_no": r.consult_no, "name": r.name, "rem_code": r.rem_code, 'no': i,
             'gender': r.gender, 'degree': r.degree, 'birthday': r.birthday,
             'register_day': datetime.strftime(r.register_day, '%Y-%m-%d'),
             'information_source': r.information_source, 'counselor': r.counselor, 'reading_school': r.reading_school,
             'grade': r.grade, 'phone': r.phone, 'tel': r.tel, 'address': r.address,
             'zipcode': r.zipcode, 'email': r.email, 'qq': r.qq, 'wechat': r.wechat,
             'mother_name': r.mother_name, 'father_name': r.father_name, 'mother_phone': r.mother_phone,
             'father_phone': r.father_phone, 'mother_tel': r.mother_tel, 'father_tel': r.father_tel,
             'mother_company': r.mother_company, 'father_company': r.father_company, 'card': r.card,
             'is_training': r.is_training, 'points': r.points, 'remark': r.remark, 'recorder': r.recorder}]

    class_info = []
    if len(rows) > 0:
        # 查询 学员 的报班信息
        classes = DanceStudentClass.query.filter_by(student_id=rows[0]['sno']).join(
            DanceClass, DanceClass.cno == DanceStudentClass.class_id).add_columns(DanceClass.class_name).all()
        for cls in classes:
            class_info.append({'join_date': datetime.strftime(cls[0].join_date, '%Y-%m-%d'),
                               'status': cls[0].status, 'remark': cls[0].remark, 'class_id': cls[0].class_id,
                               'id': cls[0].id,
                               'class_name': cls[1]})

    return jsonify({"total": total, "rows": rows, 'class_info': class_info, 'errorCode': 0, 'msg': 'ok'})


@app.route('/dance_class_get', methods=['POST'])
def dance_class_get():
    page_size = int(request.form['rows'])
    page_no = int(request.form['page'])
    print 'dance_class_get: page_size=', page_size, ' page_no=', page_no
    if page_no <= 0:    # 补丁
        page_no = 1
    rows = []
    total = DanceClass.query.count()
    offset = (page_no - 1) * page_size
    records = DanceClass.query.order_by(DanceClass.begin_year.desc(),
                                        DanceClass.class_name).limit(page_size).offset(offset)
    i = offset + 1
    for rec in records:
        rows.append({"id": rec.id, "cno": rec.cno, "school_no": rec.school_no, "school_name": rec.school_name,
                     "class_name": rec.class_name, "rem_code": rec.rem_code, "begin_year": rec.begin_year,
                     'class_type': rec.class_type, 'class_style': rec.class_style, 'teacher': rec.teacher,
                     'cost_mode': rec.cost_mode, 'cost': rec.cost, 'plan_students': rec.plan_students,
                     'cur_students': rec.cur_students, 'is_ended': rec.is_ended, 'remark': rec.remark,
                     'recorder': rec.recorder, 'no': i
                     })
        i += 1
    return jsonify({"total": total, "rows": rows, 'errorCode': 0, 'msg': 'ok'})


@app.route('/dance_class_condition_get', methods=['POST'])
def dance_class_condition_get():
    page_size = int(request.form['rows'])
    page_no = int(request.form['page'])

    rows = []
    if page_no <= 0:    # 补丁
        page_no = 1
    if page_size == -1:
        page_size = 100
    if 'is_ended' in request.form:
        is_ended = request.form['is_ended']
        records = DanceClass.query.order_by(DanceClass.id.desc()).filter(DanceClass.is_ended == is_ended).all()
        total = len(records)
        i = 1
    else:
        total = DanceClass.query.count()
        offset = (page_no - 1) * page_size
        records = DanceClass.query.order_by(DanceClass.begin_year.desc(),
                                            DanceClass.class_name).limit(page_size).offset(offset)
        i = offset + 1

    for rec in records:
        rows.append({"id": rec.id, "cno": rec.cno, "school_no": rec.school_no, "school_name": rec.school_name,
                     "class_name": rec.class_name, "rem_code": rec.rem_code, "begin_year": rec.begin_year,
                     'class_type': rec.class_type, 'class_style': rec.class_style, 'teacher': rec.teacher,
                     'cost_mode': rec.cost_mode, 'cost': rec.cost, 'plan_students': rec.plan_students,
                     'cur_students': rec.cur_students, 'is_ended': rec.is_ended, 'remark': rec.remark,
                     'recorder': rec.recorder, 'no': i
                     })
        i += 1
    return jsonify({"total": total, "rows": rows, 'errorCode': 0, 'msg': 'ok'})
