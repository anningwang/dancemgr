# -*- coding:utf-8 -*-
from flask import render_template, flash, redirect, url_for, request, g, jsonify, json, session
from flask_login import login_user, logout_user, current_user, login_required
from flask_sqlalchemy import get_debug_queries
from app import app, db, lm, babel
from forms import DanceLoginForm, DanceRegistrationForm
from models import ROLE_ADMIN, DanceStudent, DanceClass, DanceSchool, DanceUser,\
    DanceStudentClass, DanceCompany, DanceUserSchool, DcShowDetailFee, DcCommFeeMode, DcShowRecpt, DcFeeItem,\
    DanceOtherFee, DanceReceipt, DanceClassReceipt, DanceTeaching, DcClassType, DanceTeacher, DanceTeacherEdu,\
    DanceTeacherWork, DcCommon, DanceCourse, DanceCourseItem, DanceClassRoom, UpgradeClass, UpgClassItem, \
    Notepad, Expense, HouseRent, Income, DcTeachingMaterial, Exam, ReceiptExam
from datetime import datetime
from translate import microsoft_translate
from config import LANGUAGES, DATABASE_QUERY_TIMEOUT
from dcglobal import *
from tools.tools import dc_records_changed
from sqlalchemy import func


@lm.user_loader
def load_user(uid):
    return DanceUser.query.get(int(uid))


@babel.localeselector
def get_locale():
    return request.accept_languages.best_match(LANGUAGES.keys())


@app.before_request
def before_request():
    g.user = current_user
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
    print error
    return render_template('404.html'), 404


@app.errorhandler(500)
def internal_error(error):
    print error
    db.session.rollback()
    return render_template('500.html'), 500


@app.route('/', methods=['GET', 'POST'])
@app.route('/index', methods=['GET', 'POST'])
@login_required
def index():
    if 'username' in session:
        print session['username']
    return render_template('index.html',
                           title='Home')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if g.user is not None and g.user.is_authenticated:
        return redirect(url_for('index'))

    form = DanceLoginForm()
    user_dc = DanceUser.query.filter_by(name=form.username.data).first()
    if form.validate_on_submit():
        if user_dc is not None and user_dc.check_password(form.password.data):
            login_user(user_dc, remember=form.remember_me.data)
            '''
            if user_dc.check_logged():
                flash(u'用户[%s]已经登录!' % user_dc.name)
            else:
                user_dc.login()
                login_user(user_dc, remember=form.remember_me.data)
                return redirect(request.args.get('next') or url_for('index'))
            '''
            return redirect(request.args.get('next') or url_for('index'))
        else:
            flash(u'用户名或者密码错误！')

    return render_template('login.html', form=form,
                           username='' if form.username.data is None else form.username.data)


@app.route('/logout')
def logout():
    g.user.logout()
    logout_user()
    return redirect(url_for('index'))


@app.route('/register', methods=['GET', 'POST'])
def register():
    form = DanceRegistrationForm()
    if request.method == 'POST' and form.validate_on_submit():
        if DanceUser.query.filter_by(name=form.username.data).first() is not None:
            flash(u'该用户已注册！')
            return render_template('register.html', form=form)  # dance_register
        if DanceCompany.query.filter_by(company_name=form.company.data).first() is not None:
            flash(u'该公司名称已注册！')
            return render_template('register.html', form=form)  # dance_register

        company = DanceCompany(form.company.data)
        db.session.add(company)
        company = DanceCompany.query.filter_by(company_name=form.company.data).first()
        user_dc = DanceUser({'name': form.username.data,
                             'email': form.email.data,
                             'pwd': form.password.data,
                             'company_id': company.id,
                             'user_no': 1,
                             'role_id': ROLE_ADMIN,
                             'is_creator': 1})
        db.session.add(user_dc)
        create_default_data(company.id)

        db.session.commit()
        return redirect(url_for('login'))

    return render_template('register.html', form=form)        # dance_register


@app.route('/translate', methods=['POST'])
@login_required
def translate():
    return jsonify({
        'text': microsoft_translate(
            request.form['text'],
            request.form['sourceLang'],
            request.form['destLang'])})


@app.route('/dance_del_data', methods=['POST'])
@login_required
def dance_del_data():
    who = request.form['who']
    ids = request.form.getlist('ids[]')
    print 'who=', who, 'ids=', ids

    '''  module     ----------      {func: user_function}   '''
    entrance = {
                'dance_student': {'func': dc_del_student},  # 学员信息
                'dance_upgrade_class': {'func': dc_del_upgrade_class},  # 集体续班
                'DanceReceipt': {'func': dc_del_receipt},  # 收费单——学费
                'receipt_exam': {'func': dc_del_receipt_exam},  # 收费单——考级
                'exam': {'func': dc_del_exam},  # 考级信息

                'dance_teacher': {'func': dc_del_teacher},  # 员工与老师

                'dance_class': {'func': dc_del_class},  # 班级信息
                'dance_course_list': {'func': dc_del_course},  # 课程表
                'notepad': {'func': dc_del_notepad},  # 记事本
                'dance_class_room': {'func': dc_del_class_room},  # 教室

                'house_rent': {'func': dc_del_house_rent},  # 房租
                'expense': {'func': dc_del_expense},  # 其他支出
                'income': {'func': dc_del_income},  # 其他收入

                'DanceUser': {'func': dc_del_user},  # 用户管理
                'dance_fee_item': {'func': dc_del_fee_item},  # 收费项目
                'dc_comm_fee_mode': {'func': dc_del_fee_mode},  # 收费方式
                'dc_common_expense_type': {'func': dc_del_common},  # 支出类别
                'dc_common_income_type': {'func': dc_del_common},  # 收入类别
                'dc_class_type': {'func': dc_del_class_type},  # 班级类型
                'dc_common_job_title': {'func': dc_del_common},  # 职位信息
                'dance_teaching_material': {'func': dc_del_teaching_material}  # 教材信息
                }

    entrance_no_check = {
        'DanceSchool': {'table': DanceSchool}
    }

    if who in entrance:
        return entrance[who]['func'](ids)
    elif who in entrance_no_check:
        dcq = entrance_no_check[who]['table'].query
    else:
        return jsonify({'errorCode': 1, "msg": "Module[%s] not found!" % who})     # error

    for i in ids:
        rec = dcq.get(i)
        if rec is not None:
            db.session.delete(rec)

    db.session.commit()
    return jsonify({'errorCode': 0, "msg": u"删除成功！"})


def dc_del_student(ids):
    for i in ids:
        # 删除学员的报班信息
        DanceStudentClass.query.filter_by(student_id=i).delete()

    # 删除学员信息
    DanceStudent.query.filter(DanceStudent.id.in_(ids)).delete(synchronize_session=False)
    db.session.commit()
    return jsonify({'errorCode': 0, "msg": u"删除成功！"})


def dc_del_receipt(ids):
    """
    删除 收费单， 同时关联删除 班级——学费、教材费和其他费（如果存在）。
    :param ids:     收费单id list
    :return:
    """
    for i in ids:
        DanceClassReceipt.query.filter_by(receipt_id=i).delete()
        DanceTeaching.query.filter_by(receipt_id=i).delete()
        DanceOtherFee.query.filter_by(receipt_id=i).delete()

    ''' 删除 '''
    DanceReceipt.query.filter(DanceReceipt.id.in_(ids)).delete(synchronize_session=False)
    db.session.commit()
    return jsonify({'errorCode': 0, "msg": u"删除成功！"})


def dc_del_fee_item(ids):
    """
    删除 收费项目， 若收费项目已经被引用，则不能删除。
    :param ids:     记录 id list
    :return:
        errorCode       错误码
            811         收费项目[%s]已经被使用，不能删除！
    """
    school_ids = DanceSchool.get_id_list()
    for i in ids:
        fee = DcFeeItem.query.get(i)
        if fee is None:
            continue
        t = FeeItemType(int(fee.type))
        if t == FeeItemType.Study:
            is_use = DanceOtherFee.query.join(DanceReceipt, DanceReceipt.id == DanceOtherFee.receipt_id)\
                .filter(DanceReceipt.school_id.in_(school_ids)).filter(DanceOtherFee.fee_item_id == i).first()
            if is_use is not None:
                return jsonify({'errorCode': 811, 'msg': u'收费项目[%s]已经被使用，不能删除！' % fee.fee_item})
        elif t == FeeItemType.Show:
            is_use = DcShowDetailFee.query.join(DcShowRecpt, DcShowRecpt.id == DcShowDetailFee.recpt_id)\
                .filter(DcShowRecpt.school_id.in_(school_ids)).filter(DcShowDetailFee.fee_item_id == i).first()
            if is_use is not None:
                return jsonify({'errorCode': 811, 'msg': u'收费项目[%s]已经被使用，不能删除！' % fee.fee_item})
        elif t == FeeItemType.Common:
            return jsonify({'errorCode': 813, 'msg': u'待实现！'})
        else:
            return jsonify({'errorCode': 812, 'msg': u'未知类型[%d]！' % fee.type})

    ''' 删除 '''
    DcFeeItem.query.filter(DcFeeItem.id.in_(ids)).delete(synchronize_session=False)
    db.session.commit()
    return jsonify({'errorCode': 0, "msg": u"删除成功！"})


def dc_del_fee_mode(ids):
    """
    删除 收费方式（支付宝、微信、刷卡、现金）， 若收费模式已经被引用，则不能删除。
    :param ids:     记录 id list
    :return:
        errorCode       错误码
            831         收费模式[%s]已被使用，不能删除！
    """
    for i in ids:
        fee = DcCommFeeMode.query.get(i)
        if fee is None:
            continue
        """  收费单演出 判断是否使用了收费模式 """
        is_use = DcShowRecpt.query.filter_by(company_id=g.user.company_id, fee_mode_id=i).first()
        if is_use is not None:
            return jsonify({'errorCode': 831, 'msg': u'收费模式[%s]已被使用，不能删除！' % fee.fee_mode})
        """  收费单班级 判断是否使用了收费模式 """
        """  收费单普通 判断是否使用了收费模式 """

    ''' 删除 '''
    DcCommFeeMode.query.filter(DcCommFeeMode.id.in_(ids)).delete(synchronize_session=False)
    db.session.commit()
    return jsonify({'errorCode': 0, "msg": u"删除成功！"})


def dc_del_class_type(ids):
    """
    删除班级类型。删除前查看是否占用。
    :param ids:
    :return:
    {
        errorCode:      错误码
        msg:            错误信息
            ----------------    ----------------------------------------------
            errorCode           msg
            ----------------    ----------------------------------------------
            0                   删除成功！
            832                 班级类型[%s]已被使用，不能删除！
    }
    """
    school_ids = DanceSchool.get_id_list()
    for i in ids:
        r = DcClassType.query.get(i)
        if r is None:
            continue
        is_use = DanceClass.query.filter(DanceClass.school_id.in_(school_ids))\
            .filter(DanceClass.class_type == i).first()
        if is_use is not None:
            return jsonify({'errorCode': 832, 'msg': u'班级类型[%s]已被使用，不能删除！' % r.name})

    ''' 删除 '''
    DcClassType.query.filter(DcClassType.id.in_(ids)).delete(synchronize_session=False)
    db.session.commit()
    return jsonify({'errorCode': 0, "msg": u"删除成功！"})


def dc_del_teacher(ids):
    """
    删除员工与老师。删除前查看是否占用。
    :param ids:
    :return:
    {
        errorCode:      错误码
        msg:            错误信息
            ----------------    ----------------------------------------------
            errorCode           msg
            ----------------    ----------------------------------------------
            0                   删除成功！
            832                 班级类型[%s]已被使用，不能删除！
    }
    """
    for i in ids:
        """ 查看员工与老师是否在使用，是否满足删除条件 """
        # r = DcClassType.query.get(i)
        # if r is None:
        #    continue
        # is_use = DanceClass.query.filter_by(class_type=i).first()
        # if is_use is not None:
        #    return jsonify({'errorCode': 832, 'msg': u'班级类型[%s]已被使用，不能删除！' % r.name})
        DanceTeacherEdu.query.filter(DanceTeacherEdu.id == i).delete()
        DanceTeacherWork.query.filter(DanceTeacherWork.id == i).delete()

    ''' 删除 '''
    DanceTeacher.query.filter(DanceTeacher.id.in_(ids)).delete(synchronize_session=False)
    db.session.commit()
    return jsonify({'errorCode': 0, "msg": u"删除成功！"})


def dc_del_common(ids):
    """
    删除 公共信息：包括 职位信息，文化程度等， 若记录已经被引用，则不能删除。
    :param ids:     记录 id list
    :return: {
        errorCode:      错误码
        msg:            错误信息
            ----------------    ----------------------------------------------
            errorCode           msg
            ----------------    ----------------------------------------------
            0                   删除成功！
            811                 [%s]已经被使用，不能删除！
            812                 未知类型[%d]！
    }
    """
    for i in ids:
        r = DcCommon.query.get(i)
        if r is None:
            continue
        if r.type == COMM_TYPE_JOB_TITLE:
            is_use = DanceTeacher.query.filter_by(company_id=g.user.company_id, te_title=i).first()
            if is_use is not None:
                return jsonify({'errorCode': 811, 'msg': u'[%s]已经被使用，不能删除！' % r.name})
        elif r.type == COMM_TYPE_DEGREE:
            if r.scope == DEGREE_SCOPE_STUDENT or r.scope == DEGREE_SCOPE_ALL:
                is_use = DanceStudent.query.filter_by(company_id=g.user.company_id, degree=i).first()
                if is_use is not None:
                    return jsonify({'errorCode': 811, 'msg': u'[%s]已经被使用，不能删除！' % r.name})

            if r.scope == DEGREE_SCOPE_TEACHER or r.scope == DEGREE_SCOPE_ALL:
                is_use = DanceTeacher.query.filter_by(company_id=g.user.company_id, degree=i).first()
                if is_use is not None:
                    return jsonify({'errorCode': 811, 'msg': u'[%s]已经被使用，不能删除！' % r.name})
        elif r.type == COMM_TYPE_EXPENSE:
            is_use = Expense.query.filter_by(company_id=g.user.company_id, type_id=i).first()
            if is_use is not None:
                return jsonify({'errorCode': 811, 'msg': u'[%s]已经被使用，不能删除！' % r.name})
        elif r.type == COMM_TYPE_INCOME:
            is_use = Income.query.filter_by(company_id=g.user.company_id, type_id=i).first()
            if is_use is not None:
                return jsonify({'errorCode': 811, 'msg': u'[%s]已经被使用，不能删除！' % r.name})
        else:
            return jsonify({'errorCode': 812, 'msg': u'未知类型[%d]！' % r.type})

    ''' 删除 '''
    DcCommon.query.filter(DcCommon.id.in_(ids)).delete(synchronize_session=False)
    db.session.commit()
    return jsonify({'errorCode': 0, "msg": u"删除成功！"})


def dc_del_course(ids):
    """
    删除 课程表：包括 课程表明细， 若课程表没有结束（无结束日期，或者结束日期未到），则不能删除。
    :param ids:     记录 id list
    :return: {
        errorCode:      错误码
        msg:            错误信息
            ----------------    ----------------------------------------------
            errorCode           msg
            ----------------    ----------------------------------------------
            0                   删除成功！
            811                 [%s]已经被使用，不能删除！
            812                 未知类型[%d]！
    }
    """
    for i in ids:
        r = DanceCourse.query.get(i)
        if r is None:
            continue

        item = DanceCourseItem.query.filter_by(course_id=i).first()
        if item is not None and r.valid == 1:
            return jsonify({'errorCode': 811, 'msg': u'课程表未结束，不能删除！'})
        """删除课程表明细"""
        DanceCourseItem.query.filter_by(course_id=i).delete()

    ''' 删除 '''
    DanceCourse.query.filter(DanceCourse.id.in_(ids)).delete(synchronize_session=False)
    db.session.commit()
    return jsonify({'errorCode': 0, "msg": u"删除成功！"})


def dc_del_user(ids):
    """
    删除 用户
        不能删除的用户有：
            1. 初始管理员。
    :param ids:     记录 id list
    :return: {
        errorCode:      错误码
        msg:            错误信息
            ----------------    ----------------------------------------------
            errorCode           msg
            ----------------    ----------------------------------------------
            0                   删除成功！
            500                 账号[%s]为初始管理员，不能删除！
    }
    """
    for i in ids:
        r = DanceUser.query.get(i)
        if r is None:
            continue

        if r.is_creator == 1:
            return jsonify({'errorCode': 500, 'msg': u'账号[%s]为初始管理员，不能删除！' % r.name})

    ''' 删除 '''
    DanceUser.query.filter(DanceUser.id.in_(ids)).delete(synchronize_session=False)
    db.session.commit()
    return jsonify({'errorCode': 0, "msg": u"删除成功！"})


def dc_del_class(ids):
    """
    删除 班级
    :param ids:     记录 id list
    :return: {
        errorCode:      错误码
        msg:            错误信息
            ----------------    ----------------------------------------------
            errorCode           msg
            ----------------    ----------------------------------------------
            0                   删除成功！
            100                 班级[%s]已有学员报名，不能删除！
    }
    """
    for i in ids:
        r = DanceClass.query.get(i)
        if r is None:
            continue
        ''' 检查是否满足删除条件。 当班级有学员报名后，不能删除该班级 '''
        is_use = DanceClass.query.join(DanceStudentClass, DanceStudentClass.class_id == DanceClass.id)\
            .filter(DanceStudentClass.company_id == g.user.company_id, DanceClass.id == i).first()
        if is_use is not None:
            return jsonify({'errorCode': 100, 'msg': u'班级[%s]已有学员报名，不能删除！' % r.class_name})

    ''' 删除 '''
    DanceClass.query.filter(DanceClass.id.in_(ids)).delete(synchronize_session=False)
    db.session.commit()
    return jsonify({'errorCode': 0, "msg": u"删除成功！"})


def dc_del_class_room(ids):
    """
    删除 教室： 若教室被占用（课程表中使用），则不能删除。
    :param ids:     记录 id list
    :return: {
        errorCode:      错误码
        msg:            错误信息
            ----------------    ----------------------------------------------
            errorCode           msg
            ----------------    ----------------------------------------------
            0                   删除成功！
            821                 教室已使用，不能删除！
    }
    """
    for i in ids:
        r = DanceClassRoom.query.get(i)
        if r is None:
            continue
        """检查是否占用"""
        dup = DanceClassRoom.query.filter_by(company_id=g.user.company_id, room_id=i).first()
        if dup is not None:
            return jsonify({'errorCode': 821, 'msg': u'教室已使用，不能删除！'})

    ''' 删除 '''
    DanceClassRoom.query.filter(DanceClassRoom.id.in_(ids)).delete(synchronize_session=False)
    db.session.commit()
    return jsonify({'errorCode': 0, "msg": u"删除成功！"})


def dc_del_upgrade_class(ids):
    """
    删除 集体续班： 直接删除相同编号的 集体续班数据，不做关联判断。
    :param ids:     记录 id list
    :return: {
        errorCode:      错误码
        msg:            错误信息
            ----------------    ----------------------------------------------
            errorCode           msg
            ----------------    ----------------------------------------------
            0                   删除成功！
            821                 教室已使用，不能删除！
    }
    """
    n = 0
    for i in ids:
        r = UpgradeClass.query.get(i)
        if r is None:
            continue
        """删除 集体续班 明细表"""
        n += UpgClassItem.query.filter_by(upg_id=i).delete()

    ''' 删除 '''
    m = UpgradeClass.query.filter(UpgradeClass.id.in_(ids)).delete(synchronize_session=False)
    db.session.commit()
    return jsonify({'errorCode': 0, "msg": u"删除成功！集体续费单[%d]条，学员续费明细[%d]条。" % (m, n)})


def dc_del_notepad(ids):
    # 删除 记事本
    Notepad.query.filter(Notepad.id.in_(ids)).delete(synchronize_session=False)
    db.session.commit()
    return jsonify({'errorCode': 0, "msg": u"删除成功！"})


def dc_del_expense(ids):
    # 删除 其他支出单
    Expense.query.filter(Expense.id.in_(ids)).delete(synchronize_session=False)
    db.session.commit()
    return jsonify({'errorCode': 0, "msg": u"删除成功！"})


def dc_del_house_rent(ids):
    # 删除 房租
    HouseRent.query.filter(HouseRent.id.in_(ids)).delete(synchronize_session=False)
    db.session.commit()
    return jsonify({'errorCode': 0, "msg": u"删除成功！"})


def dc_del_income(ids):
    # 删除 其他收入单
    Income.query.filter(Income.id.in_(ids)).delete(synchronize_session=False)
    db.session.commit()
    return jsonify({'errorCode': 0, "msg": u"删除成功！"})


def dc_del_teaching_material(ids):
    """
    删除 教材信息： 若 教材信息 被占用（ 收费单——学费 中使用），则不能删除。
    :param ids:     记录 id list
    :return: {
        errorCode:      错误码
        msg:            错误信息
            ----------------    ----------------------------------------------
            errorCode           msg
            ----------------    ----------------------------------------------
            0                   删除成功！
            821                 “教材[%s]”已使用，不能删除！
    }
    """
    for i in ids:
        r = DcTeachingMaterial.query.get(i)
        if r is None:
            continue
        """检查是否占用"""
        dup = DanceTeaching.query.join(DanceReceipt, DanceReceipt.id == DanceTeaching.receipt_id)\
            .filter(DanceReceipt.company_id == g.user.company_id, DanceTeaching.material_id == i).first()
        if dup is not None:
            return jsonify({'errorCode': 821, 'msg': u'“教材[%s]”已使用，不能删除！' % r.material_name})

    ''' 删除 '''
    DcTeachingMaterial.query.filter(DcTeachingMaterial.id.in_(ids)).delete(synchronize_session=False)
    db.session.commit()
    return jsonify({'errorCode': 0, "msg": u"删除成功！"})


def dc_del_exam(ids):
    """
    删除 考级信息： 若 考级信息 被占用（ 收费单——考级 中使用），则不能删除。
    :param ids:     记录 id list
    :return: {
        errorCode:      错误码
        msg:            错误信息
            ----------------    ----------------------------------------------
            errorCode           msg
            ----------------    ----------------------------------------------
            0                   删除成功！
            821                 “考级信息[%s]”已使用，不能删除！
    }
    """
    for i in ids:
        r = Exam.query.get(i)
        if r is None:
            continue
        """检查是否占用"""
        dup = ReceiptExam.query.join(Exam, Exam.id == ReceiptExam.exam_id)\
            .filter(Exam.id == i).first()
        if dup is not None:
            return jsonify({'errorCode': 821, 'msg': u'“考级信息[%s]”已使用，不能删除！' % r.name})

    ''' 删除 '''
    Exam.query.filter(Exam.id.in_(ids)).delete(synchronize_session=False)
    db.session.commit()
    return jsonify({'errorCode': 0, "msg": u"删除成功！"})


def dc_del_receipt_exam(ids):
    """
    删除 收费单——考级。
    :param ids:     记录 id list
    :return: {
        errorCode:      错误码
        msg:            错误信息
            ----------------    ----------------------------------------------
            errorCode           msg
            ----------------    ----------------------------------------------
            0                   删除成功！
    }
    """
    for i in ids:
        r = ReceiptExam.query.get(i)
        if r is None:
            continue
        """检查是否占用"""
        pass

    ''' 删除 '''
    ReceiptExam.query.filter(ReceiptExam.id.in_(ids)).delete(synchronize_session=False)
    db.session.commit()
    return jsonify({'errorCode': 0, "msg": u"删除成功！"})


@app.route('/dance_student_get', methods=['POST', 'GET'])
@login_required
def dance_student_get():
    """
    查询 学员列表
        查询条件：rows          每页显示的条数
                  page          页码，第几页，从1开始
                  school_id     分校ID
                  is_training   是否在读
                  name          学员姓名过滤条件
    :return:    符合条件的学员列表
    """
    page_size = int(request.form['rows'])
    page_no = int(request.form['page'])
    print 'page_size=', page_size, ' page_no=', page_no
    if page_no <= 0:    # 容错处理
        page_no = 1

    school_ids = DanceUserSchool.get_school_ids_by_uid()

    dcq = DanceStudent.query
    if 'school_id' not in request.form or request.form['school_id'] == 'all':
        dcq = dcq.filter(DanceStudent.school_id.in_(school_ids))
    else:
        school_id_intersection = list(set(school_ids).intersection(set(map(int, request.form['school_id']))))
        if len(school_id_intersection) == 0:
            return jsonify({"total": 0, "rows": [], 'errorCode': 600, 'msg': u'您没有管理分校的权限！'})
        dcq = dcq.filter(DanceStudent.school_id.in_(school_id_intersection))

    if 'is_training' in request.form:
        dcq = dcq.filter_by(is_training=request.form['is_training'])

    if 'name' in request.form and request.form['name'] != '':
        dcq = dcq.filter(DanceStudent.name.like('%' + request.form['name'] + '%'))

    total = dcq.count()
    offset = (page_no - 1) * page_size
    records = dcq.join(DanceSchool, DanceSchool.id == DanceStudent.school_id)\
        .add_columns(DanceSchool.school_name, DanceSchool.school_no)\
        .order_by(DanceStudent.school_id, DanceStudent.id.desc())\
        .limit(page_size).offset(offset).all()
    i = offset + 1
    rows = []
    for rec in records:
        r = rec[0]
        rows.append({'id': r.id, 'sno': r.sno, 'school_no': rec[2],
                     "school_name": rec[1], "consult_no": r.consult_no, "name": r.name,
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
                     'card': r.card, 'is_training': r.is_training,
                     'points': r.points, 'remark': r.remark, 'recorder': r.recorder,
                     'idcard': r.idcard, 'mother_wechat': r.mother_wechat, 'father_wechat': r.father_wechat,
                     'nation': r.nation
                     })
        i += 1
    return jsonify({"total": total, "rows": rows})


@app.route('/dance_class_student_get', methods=['POST', 'GET'])
@login_required
def dance_class_student_get():
    """
    统计 班级内 学员 名单。
    输入： {
        class_id:           班级id
    }
    返回值: { total: number, rows: [{ ... }] record, errorCode: , msg: error massage }
    """
    class_id = request.form['class_id']

    rows = []
    records = DanceStudent.query\
        .join(DanceStudentClass, DanceStudentClass.student_id == DanceStudent.id)\
        .filter(DanceStudentClass.class_id == class_id, DanceStudentClass.status == STU_CLASS_STATUS_NORMAL,
                DanceStudentClass.company_id == g.user.company_id)\
        .join(DanceSchool, DanceSchool.id == DanceStudent.school_id)\
        .add_columns(DanceSchool.school_name, DanceSchool.school_no)\
        .all()

    total = len(records)
    i = 1
    for rec in records:
        r = rec[0]
        rows.append({"id": r.id, "sno": r.sno, "school_no": rec[2],
                     "school_name": rec[1], "consult_no": r.consult_no, "name": r.name,
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
                     'card': r.card, 'is_training': r.is_training, 'points': r.points,
                     'remark': r.remark, 'recorder': r.recorder,
                     'idcard': r.idcard, 'mother_wechat': r.mother_wechat, 'father_wechat': r.father_wechat
                     })
        i += 1
    return jsonify({"total": total, "rows": rows, 'errorCode': 0, 'msg': 'ok'})


@app.route('/dance_student_query', methods=['POST'])
@login_required
def dance_student_query():
    """
    学员界面根据学员 姓名 combo box 自动完整功能。根据 姓名 模糊查询 所有匹配条件的 姓名列表，供操作员选择。
    输入：
        name:           查询条件，必选参数。
        school_id       分校id， 可选，具体id 或者 all
    返回值：
        value:          学员姓名
        text:           学员姓名
    """
    school_ids = DanceUserSchool.get_school_ids_by_uid()
    if len(school_ids) == 0:
        return jsonify({'errorCode': 0, 'msg': 'no data'})

    name = request.form['name']
    if name.encode('UTF-8').isalpha():
        dcq = DanceStudent.query.filter(DanceStudent.rem_code.like('%' + name + '%'))
    else:
        dcq = DanceStudent.query.filter(DanceStudent.name.like('%' + name + '%'))

    if 'school_id' not in request.form or request.form['school_id'] == 'all':
        dcq = dcq.filter(DanceStudent.school_id.in_(school_ids))
    else:
        dcq = dcq.filter(DanceStudent.school_id.in_(request.form['school_id']))

    if 'is_training' in request.form:
        dcq = dcq.filter_by(is_training=request.form['is_training'])

    ret = []
    records = dcq.order_by(DanceStudent.id.desc()).all()
    for rec in records:
        ret.append({'value': rec.name, 'text': rec.name})

    return jsonify(ret)


@app.route('/dance_student_details_get', methods=['POST', 'GET'])
@login_required
def dance_student_details_get():
    """
    查询学员的详细信息，包括学员的报班信息
        查询条件：rows          每页显示的条数，可选，默认 30
                  page          页码，第几页，从1开始
                                特殊值 -2，表示根据 student_id 查询，并求出该学员的 序号
                  student_id    学员id, optional, 当 page==-2,必须传递student_id
                  school_id     分校ID
                  is_training   是否在读
                  name          学员姓名过滤条件
    :return:        学员的详细信息，包括报班信息
                  errorCode     错误码
                  msg           错误信息
                  rows          学员基本信息
                  total         学员个数 == 1
                  class_info    该学员的报班列表
    """
    obj = request.form

    page_size = int(obj['rows']) if 'rows' in obj else 30
    page_no = int(obj['page']) if 'page' in obj else -2
    print 'page_size=', page_size, ' page_no=', page_no

    school_ids = DanceUserSchool.get_school_ids_by_uid()
    dcq = DanceStudent.query
    if 'school_id' not in obj or obj['school_id'] == 'all':
        dcq = dcq.filter(DanceStudent.school_id.in_(school_ids))
    else:
        school_id_intersection = list(set(school_ids).intersection(set(map(int, obj['school_id']))))
        if len(school_id_intersection) == 0:
            return jsonify({"total": 0, "rows": [], 'errorCode': 600, 'msg': u'您没有管理分校的权限！'})
        dcq = dcq.filter(DanceStudent.school_id.in_(school_id_intersection))

    if 'is_training' in obj:
        dcq = dcq.filter_by(is_training=obj['is_training'])

    if 'name' in obj and obj['name'] != '':
        dcq = dcq.filter(DanceStudent.name.like('%' + obj['name'] + '%'))

    total = dcq.count()

    dcq = dcq.join(DanceSchool, DanceSchool.id == DanceStudent.school_id) \
        .add_columns(DanceSchool.school_name, DanceSchool.school_no) \
        .order_by(DanceStudent.school_id, DanceStudent.id.desc())

    if page_no <= -2:
        student_id = int(obj['student_id'])
        # 根据 sno 获取学生详细信息，并求出其序号。
        r = DanceStudent.query.get(student_id)
        if r is None:
            return jsonify({'errorCode': 400, 'msg': u'不存在学号为[%s]的学员！' % student_id})
        i = dcq.filter(DanceStudent.id >= r.id).count()
        if i == 0:
            i = 1
        dcq = DanceStudent.query.filter(DanceStudent.id == student_id)\
            .join(DanceSchool, DanceSchool.id == DanceStudent.school_id) \
            .add_columns(DanceSchool.school_name, DanceSchool.school_no)
    else:
        if page_no <= 0:  # 容错处理
            page_no = 1
        offset = (page_no - 1) * page_size
        dcq = dcq.limit(page_size).offset(offset)
        i = offset + 1

    records = dcq.first()

    ''' bug fix:  按照姓名查找流失学员，再将学员修改为 在读（新增报班信息），此时查询应该为空 '''
    if records is None:
        records = DanceStudent.query\
            .filter(DanceStudent.id == obj['student_id'], DanceStudent.company_id == g.user.company_id) \
            .join(DanceSchool, DanceSchool.id == DanceStudent.school_id) \
            .add_columns(DanceSchool.school_name, DanceSchool.school_no).first()
        if records is None:
            return jsonify({"total": total, "rows": {}, 'class_info': [], 'errorCode': 0, 'msg': 'ok'})

    r = records[0]
    rows = {"id": r.id, "sno": r.sno, "school_no": records[2], "school_name": records[1], 'school_id': r.school_id,
            "consult_no": r.consult_no, "name": r.name, "rem_code": r.rem_code, 'no': i,
            'gender': r.gender, 'degree': r.degree, 'birthday': r.birthday,
            'register_day': datetime.strftime(r.register_day, '%Y-%m-%d'),
            'information_source': r.information_source, 'counselor': r.counselor, 'reading_school': r.reading_school,
            'grade': r.grade, 'phone': r.phone, 'tel': r.tel, 'address': r.address,
            'zipcode': r.zipcode, 'email': r.email, 'qq': r.qq, 'wechat': r.wechat,
            'mother_name': r.mother_name, 'father_name': r.father_name, 'mother_phone': r.mother_phone,
            'father_phone': r.father_phone, 'mother_tel': r.mother_tel, 'father_tel': r.father_tel,
            'mother_company': r.mother_company, 'father_company': r.father_company, 'card': r.card,
            'is_training': r.is_training, 'points': r.points, 'remark': r.remark, 'recorder': r.recorder,
            'idcard': r.idcard, 'mother_wechat': r.mother_wechat, 'father_wechat': r.father_wechat,
            'nation': r.nation
            }

    class_info = []
    if len(rows) > 0:
        # 查询 学员 的报班信息
        classes = DanceStudentClass.query.filter_by(student_id=r.id).filter_by(company_id=g.user.company_id)\
            .join(DanceClass, DanceClass.id == DanceStudentClass.class_id)\
            .add_columns(DanceClass.class_name, DanceClass.cno).order_by(DanceStudentClass.join_date.desc()).all()
        for cls in classes:
            class_info.append({'join_date': datetime.strftime(cls[0].join_date, '%Y-%m-%d'),
                               'status': cls[0].status, 'remark': cls[0].remark, 'class_id': cls[0].class_id,
                               'id': cls[0].id,
                               'class_name': cls[1], 'class_no': cls[2]})

    return jsonify({"total": total, "rows": rows, 'class_info': class_info, 'errorCode': 0, 'msg': 'ok'})


@app.route('/dance_student_details_extras', methods=['POST'])
@login_required
def dance_student_details_extras():
    """
    学员详细信息页面，查询学员的附加信息：1. 包括学员所在分校的可报班级（班级编号 和 班级名称）
        2. 分校id, 分校名称 列表
    输入参数：
    {
        student_id:     学员id, 可选。 输入该字段，则只查询 学员所在分校的“未结束”班级列表
        school_id:      分校id。可选（'all'），表示查询所有分校的“未结束”班级列表。
    }
    :return:
    {
        classlist: [{       班级列表
            class_id:       id
            class_name:
            class_type:     班级类型 value
            class_type_text:        班级类型名称
            class_no:       编号
        }]
        schoollist: [{      分校列表
            school_id:
            school_name:
            school_no:
        }}
        errorCode:          错误码
        msg:                错误信息
            ----------------    ----------------------------------------------
            errorCode           msg
            ----------------    ----------------------------------------------
            0                   'ok'
    }
    """
    dcq = DanceClass.query.filter(DanceClass.is_ended == 0)

    if 'student_id' in request.form:
        stu = DanceStudent.query.get(request.form['student_id'])
        if stu is not None:
            dcq = dcq.filter(DanceClass.school_id == stu.school_id)

    school_ids = DanceUserSchool.get_school_ids_by_uid()
    if 'school_id' not in request.form or request.form['school_id'] == 'all':
        school_id_intersection = school_ids
    else:
        school_id_intersection = list(set(school_ids).intersection(set(map(int, request.form['school_id']))))

    if len(school_id_intersection) == 0:
        return jsonify({'errorCode': 600, 'msg': u'您没有管理分校的权限！'})
    dcq = dcq.filter(DanceClass.school_id.in_(school_id_intersection))
    records = dcq.join(DcClassType, DcClassType.id == DanceClass.class_type).add_columns(DcClassType.name)\
        .order_by(DanceClass.class_type).all()

    classes = []
    for rec in records:
        cls = rec[0]
        classes.append({'class_id': cls.id, 'class_name': cls.class_name, 'class_type': cls.class_type,
                        'class_no': cls.cno, 'class_type_text': rec[1]})

    schoollist = []
    school_rec = DanceSchool.query.filter(DanceSchool.id.in_(school_id_intersection)).all()
    for sc in school_rec:
        schoollist.append({'school_id': sc.id, 'school_name': sc.school_name,
                           'school_no': sc.school_no})

    return jsonify({'classlist': classes, 'schoollist': schoollist, 'errorCode': 0, 'msg': 'ok'})


@app.route('/dance_student_add', methods=['POST'])
@login_required
def dance_student_add():
    json_data = request.form['data']
    obj_data = json.loads(json_data)

    student = obj_data['student']
    classes = obj_data['class']

    if 'school_id' not in student:
        return jsonify({'errorCode': 800, 'msg': u'请提供[分校id]'})
    if 'register_day' not in student or student['register_day'] == '':
        return jsonify({'errorCode': 800, 'msg': u'请填写注册日期'})

    allow_same_name = True if 'allowSameName' in student and student['allowSameName'] == 'y'else False

    if not allow_same_name:
        ''' bug fix: 增加 分校及培训中心的过滤条件 '''
        stu = DanceStudent.query.filter_by(company_id=g.user.company_id, school_id=student['school_id'],
                                           name=student['name']).first()
        if stu is not None:
            return jsonify({'errorCode': 100,
                            'msg': u'学员[%s]已经存在！勾选[允许重名]可添加重名学员。' % student['name']})

    new_stu = DanceStudent(student)
    db.session.add(new_stu)
    new_stu = DanceStudent.query.filter_by(company_id=g.user.company_id, sno=new_stu.sno).first()

    for cls in classes:
        cls['student_id'] = new_stu.id
        dcstucls = DanceStudentClass(cls)
        db.session.add(dcstucls)

    db.session.commit()
    return jsonify({'errorCode': 0, 'msg': u'成功添加学员[%s](%s)' % (new_stu.name, new_stu.sno)})


@app.route('/dance_student_modify', methods=['POST'])
@login_required
def dance_student_modify():
    """
    修改学员信息，每次只能修改一条
    :return:
    """
    json_data = request.form['data']
    obj_data = json.loads(json_data)

    student = obj_data['student']
    classes = obj_data['class']

    school_ids = DanceUserSchool.get_school_ids_by_uid()
    stu = DanceStudent.query.get(student['id'])
    if stu.school_id not in school_ids:
        return jsonify({'errorCode': 1000, 'msg': u'你没有修改该分校学员的权限！'})

    # 更新学员报班信息
    for cls in classes:
        if 'id' in cls:
            rec = DanceStudentClass.query.get(cls['id'])
            if rec is not None:
                if 'oper' in cls:
                    db.session.delete(rec)  # 删除
                else:
                    rec.update(cls)  # 更新
                    db.session.add(rec)
        else:
            # 新增
            stucls = DanceStudentClass.query.filter_by(company_id=g.user.company_id)\
                .filter_by(student_id=student['id'])\
                .filter_by(class_id=cls['class_id']).first()
            if stucls is None:
                stucls = DanceStudentClass(cls)
                stucls.student_id = stu.id
            else:
                stucls.update(cls)
            db.session.add(stucls)
    """更新学员基本信息"""
    stu.update(student)
    db.session.add(stu)

    db.session.commit()
    return jsonify({'errorCode': 0, 'msg': u'更新成功！'})


@app.route('/dance_class_get', methods=['POST'])
@login_required
def dance_class_get():
    """
    查询班级列表
    输入参数：
    {
        page:           查询的页数
        rows:           每页记录数
        school_id:      分校id 列表，例如：[1,2,3]， 'all' 为所有分校。
        is_ended:       班级是否结束
        name:           查询条件，根据班名称查询。可选参数。
    }
    返回值:
    {
        total:          符合条件的记录总数
        rows:
        errorCode:      错误码
        msg:            错误信息
    }
    """
    page_size = int(request.form['rows'])
    page_no = int(request.form['page'])
    # print 'dance_class_get: page_size=', page_size, ' page_no=', page_no
    if page_no <= 0:    # 补丁
        page_no = 1

    school_ids = DanceUserSchool.get_school_ids_by_uid()
    if len(school_ids) == 0:
        return jsonify({'total': 0, 'rows': [], 'errorCode': 0, 'msg': 'ok'})

    dcq = DanceClass.query

    if 'school_id' not in request.form or request.form['school_id'] == 'all':
        dcq = dcq.filter(DanceClass.school_id.in_(school_ids))
    else:
        school_id_intersection = list(set(school_ids).intersection(set(map(int, request.form['school_id']))))
        if len(school_id_intersection) == 0:
            return jsonify({"total": 0, "rows": [], 'errorCode': 600, 'msg': u'您没有管理分校的权限！'})
        dcq = dcq.filter(DanceClass.school_id.in_(school_id_intersection))

    if 'is_ended' in request.form:
        is_ended = request.form['is_ended']
        dcq = dcq.filter(DanceClass.is_ended == is_ended)

    if 'name' in request.form and request.form['name'] != '':
        dcq = dcq.filter(DanceClass.class_name.like('%' + request.form['name'] + '%'))

    total = dcq.count()
    offset = (page_no - 1) * page_size
    records = dcq.join(DanceSchool, DanceSchool.id == DanceClass.school_id)\
        .join(DcClassType, DcClassType.id == DanceClass.class_type)\
        .add_columns(DanceSchool.school_name, DanceSchool.school_no, DcClassType.name)\
        .order_by(DanceClass.school_id, DanceClass.id.desc())\
        .limit(page_size).offset(offset).all()
    i = offset + 1

    """ SQL Alchemy 的方法"""
    cnt = db.session.query(DanceStudentClass.class_id, func.count('class_id')).select_from(DanceStudentClass)\
        .filter(DanceStudentClass.company_id == g.user.company_id,
                DanceStudentClass.status == STU_CLASS_STATUS_NORMAL).group_by(DanceStudentClass.class_id).all()
    cnt_dict = {}
    for a in cnt:
        cnt_dict[a[0]] = a[1]

    rows = []
    for recs in records:
        rec = recs[0]
        """查询班级学员数量，暂时不知道如何通过一个SQL查询出来。"""
        # stu_num = DanceStudentClass.query.filter_by(class_id=rec.id, status=STU_CLASS_STATUS_NORMAL).count()
        rows.append({"id": rec.id, "cno": rec.cno, "school_no": recs[2], "school_name": recs[1],
                     "class_name": rec.class_name, "rem_code": rec.rem_code, "begin_year": rec.begin_year,
                     'class_type': recs[3], 'class_type_id': rec.class_style,
                     'class_style': get_class_style(rec.class_style), 'class_style_value': rec.class_style,
                     'teacher': rec.teacher,
                     'cost_mode': get_class_mode(rec.cost_mode), 'cost_mode_value': rec.cost_mode,
                     'cost': rec.cost, 'plan_students': rec.plan_students,
                     'cur_students': rec.cur_students, 'is_ended': rec.is_ended, 'remark': rec.remark,
                     'recorder': rec.recorder, 'no': i, 'school_id': rec.school_id,
                     'stuNum': cnt_dict.get(rec.id, '-')
                     })
        i += 1
    return jsonify({"total": total, "rows": rows, 'errorCode': 0, 'msg': 'ok'})


@app.route('/dance_class_query', methods=['POST'])
@login_required
def dance_class_query():
    """
    班级信息 界面根据 班级名称 combo box 自动完整功能。
    输入：
    {
        name:           查询条件，必选参数。
        school_id       分校id， 可选，具体id 或者 all
        is_ended        是否结束
    }
    返回值：
    {
        value:          学员姓名
        text:           学员姓名
    }
    """
    school_ids = DanceUserSchool.get_school_ids_by_uid()
    if len(school_ids) == 0:
        return jsonify({'errorCode': 0, 'msg': 'no data'})

    name = request.form['name']
    if name.encode('UTF-8').isalpha():
        dcq = DanceClass.query.filter(DanceClass.rem_code.like('%' + name + '%'))
    else:
        dcq = DanceClass.query.filter(DanceClass.class_name.like('%' + name + '%'))

    if 'school_id' not in request.form or request.form['school_id'] == 'all':
        dcq = dcq.filter(DanceClass.school_id.in_(school_ids))
    else:
        dcq = dcq.filter(DanceClass.school_id.in_(request.form['school_id']))

    is_ended = request.form['is_ended']
    dcq = dcq.filter_by(is_ended=is_ended)

    ret = []
    records = dcq.order_by(DanceClass.id.desc()).all()
    for rec in records:
        ret.append({'value': rec.class_name, 'text': rec.class_name})

    return jsonify(ret)


@app.route('/dance_class_detail_get', methods=['POST'])
@login_required
def dance_class_detail_get():
    """
    查询班级详细信息
    输入信息
    {
        id:     记录ID
    }
    :return:
    """
    obj = request.json

    recs = DanceClass.query.filter(DanceClass.id == obj['id'])\
        .join(DanceSchool, DanceSchool.id == DanceClass.school_id)\
        .join(DcClassType, DcClassType.id == DanceClass.class_type)\
        .add_columns(DanceSchool.school_name, DanceSchool.school_no, DcClassType.name).first()
    if recs is None:
        return jsonify({"row": {}, 'errorCode': 120, 'msg': u'班级信息[id=%d]不存在！' % obj['id']})

    rec = recs[0]
    """查询班级实际人数"""
    class_dict = DanceStudentClass.get_class_stu_num(rec.id)
    row = {"id": rec.id, "cno": rec.cno, "school_no": recs[2], "school_name": recs[1],
           "class_name": rec.class_name, "rem_code": rec.rem_code, "begin_year": rec.begin_year,
           'class_type': recs[3], 'class_type_id': rec.class_style,
           'class_style': get_class_style(rec.class_style), 'class_style_value': rec.class_style,
           'teacher': rec.teacher,
           'cost_mode': get_class_mode(rec.cost_mode), 'cost_mode_value': rec.cost_mode,
           'cost': rec.cost, 'plan_students': rec.plan_students,
           'cur_students': rec.cur_students, 'is_ended': rec.is_ended, 'remark': rec.remark,
           'recorder': rec.recorder, 'school_id': rec.school_id,
           'stuNum': class_dict.get(rec.id, None)
           }

    return jsonify({"row": row, 'errorCode': 0, 'msg': 'ok'})


@app.route('/dance_class_modify', methods=['POST'])
@login_required
def dance_class_modify():
    """
    新增/更新 班级。
    输入参数：
    {
        id:             id, > 0 修改记录。 <= 0 新增
        class_name:
        begin_year:
        class_type:
        class_style:
        teacher:
        cost_mode:
        cost:
        plan_students:
        cur_students:
        is_ended:
        remark:
        school_id:
    }
    :return:
        {errorCode :  0  or 其他。 0 表示成功      --- 新增成功！ or  更新成功！
            301     班级记录id[%s]不存在！
            302     u'班级名称重复！'
        msg : 'ok' or 其他错误
        }
    """
    obj = request.json
    if 'id' not in obj or int(obj['id']) <= 0:
        """ 判断是否有重名班级 """
        cls = DanceClass.query.filter_by(school_id=obj['school_id']).filter_by(class_name=obj['class_name']).first()
        if cls is not None:
            return jsonify({'errorCode': 302, 'msg': u'班级名称重复！'})

        cls = DanceClass(obj)
        db.session.add(cls)
        msg = u'新增成功！'
    else:
        # 修改记录
        cls = DanceClass.query.get(obj['id'])
        if cls is None:
            return jsonify({'errorCode': 301, 'msg': u'班级记录id[%s]不存在！' % obj['id']})

        """ 判断是否有重名班级 """
        dup = DanceClass.query.filter_by(school_id=obj['school_id']).filter(DanceClass.id != obj['id'])\
            .filter_by(class_name=obj['class_name']).first()
        if dup is not None:
            return jsonify({'errorCode': 302, 'msg': u'班级名称重复！'})

        cls.update(obj)
        db.session.add(cls)
        msg = u'更新成功！'

    db.session.commit()
    return jsonify({'errorCode': 0, 'msg': msg})


@app.route('/dance_course_modify', methods=['POST'])
@login_required
def dance_course_modify():
    """
    新增/更新 课程表。
    输入参数：
        {row: {},               课程表 基本信息
        item: [{                课程表明细，可选参数
        }]
    :return:
    {
        errorCode:          错误码
        msg:                错误信息
        ----------------    ----------------------------------------------
        errorCode           msg
        ----------------    ----------------------------------------------
        0                   更新成功！
        202                 参数错误！
        301                 记录[id=%d]不存在！
        600                 Parameter error. [data] required.
    }
    """
    if request.json is not None:
        obj = request.json
    else:
        if 'data' not in request.form:
            return jsonify({'errorCode': 600, 'msg': 'Parameter error. [data] required.'})
        json_str = request.form['data']
        obj = json.loads(json_str)
    if 'row' not in obj:
        return jsonify({'errorCode': 202, 'msg': u'参数错误！'})
    if 'id' not in obj['row'] or int(obj['row']['id']) <= 0:
        return dance_course_add(obj)  # 新增记录

    """ 修改 课程表 基本情况 """
    rid = obj['row']['id']
    rec = DanceCourse.query.get(rid)
    if rec is None:
        return jsonify({'errorCode': 301, 'msg': u'记录[id=%d]不存在！' % rid})
    rec.update(obj['row'])
    db.session.add(rec)

    """ 修改 课程表明细"""
    if 'item' in obj:
        data = obj['item']
        records = DanceCourseItem.query.filter_by(course_id=rid).all()
        old_ids = []
        for rec in records:
            old_ids.append({'id': rec.id})
        change = dc_records_changed(old_ids, data, 'id')
        for i in change['add']:
            data[i]['course_id'] = rid
            nr = DanceCourseItem(data[i])
            db.session.add(nr)
        for i in change['upd']:
            nr = DanceCourseItem.query.get(data[i]['id'])
            nr.update(data[i])
            db.session.add(nr)
        for i in change['del']:
            DanceCourseItem.query.filter_by(id=old_ids[i]['id']).delete()

    db.session.commit()
    return jsonify({'errorCode': 0, 'msg': u'更新成功！'})


def dance_course_add(obj):
    """
    新增 课程表 明细。
    :param obj:
        {row: {},               课程表基本信息
        item: [{                课程表明细
        }]
    :return:
    """
    nr = DanceCourse(obj['row'])
    db.session.add(nr)
    nr = DanceCourse.query.filter_by(company_id=g.user.company_id, code=nr.code).first()
    if nr is None:
        return jsonify({'errorCode': 1002, 'msg': u'新增课程表失败。'})
    """ 新增 课程表明细"""
    if 'item' in obj:
        for dt in obj['item']:
            dt['course_id'] = nr.id
            db.session.add(DanceCourseItem(dt))

    db.session.commit()
    return jsonify({'errorCode': 0, 'msg': u'新增成功！'})


@app.route('/dance_course_single_get', methods=['POST'])
@login_required
def dance_course_single_get():
    if request.json is not None:
        obj = request.json
    else:
        return jsonify({'errorCode': 700, 'msg': u'输入参数错误。'})

    dcq = DanceCourse.query.filter_by(company_id=g.user.company_id, id=obj['id'])
    dcq = dcq.join(DanceSchool, DanceSchool.id == DanceCourse.school_id)

    dcr = dcq.add_columns(DanceSchool.school_name, DanceSchool.school_no).first()
    rec = dcr[0]
    row = {'id': rec.id, "code": rec.code, 'recorder': rec.recorder,
           'last_u': rec.last_u, 'create_at': datetime.strftime(rec.create_at, '%Y-%m-%d'),
           'last_t': datetime.strftime(rec.last_t, '%Y-%m-%d %H:%M:%S'),
           'begin': datetime.strftime(rec.begin, '%Y-%m-%d'),
           'end': datetime.strftime(rec.end, '%Y-%m-%d') if rec.end is not None else None,
           'valid': rec.valid, 'valid_text': u'否' if rec.valid == 1 else u'是',
           'name': rec.name, 'school_id': rec.school_id,
           'school_name': dcr[1], 'school_no': dcr[2]}

    return jsonify({"total": 1, "row": row, 'errorCode': 0, 'msg': 'ok'})


def create_default_data(company_id):
    """ 用户注册后，创建默认数据 """
    r = DanceSchool({'school_name': u'总部', 'company_id': company_id, 'school_no': '0001', 'recorder': u'[系统]'})
    db.session.add(r)

    # 增加 用户 管理 分校 的权限
    sc = DanceSchool.query.filter_by(company_id=company_id).filter_by(school_no=r.school_no).first()
    u = DanceUser.query.filter_by(company_id=company_id).filter_by(is_creator=1).first()
    db.session.add(DanceUserSchool(user_id=u.id, school_id=sc.id))

    db.session.commit()
