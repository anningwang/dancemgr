# -*- coding:utf-8 -*-
from flask import request, jsonify, g
from flask_login import login_required
from app import app, db
from models import DanceSchool, DanceUser, DanceUserSchool
import json

ERROR_CODE_USER_IS_EXIST = 100

ERROR_MSG_USER_IS_EXIST = u'用户名称 [%s] 已经存在！'


@app.route('/dance_school_get', methods=['POST'])
@login_required
def dance_school_get():
    page_size = int(request.form['rows'])
    page_no = int(request.form['page'])
    condition = request.form['condition']

    print '[dance_get_school]: page_size=', page_size, ' page_no=', page_no
    if page_no <= 0:    # 补丁
        page_no = 1
    rows = []
    if condition == '':
        total = DanceSchool.query.filter_by(company_id=g.user.company_id).count()
    else:
        total = DanceSchool.query.filter_by(company_id=g.user.company_id).filter(
            DanceSchool.school_name.like('%'+condition+'%')).count()

    offset = (page_no - 1) * page_size
    records = DanceSchool.query.order_by(
        DanceSchool.school_no.asc(), DanceSchool.school_name).filter_by(company_id=g.user.company_id).filter(
        DanceSchool.school_name.like('%'+condition+'%')).limit(page_size).offset(offset)
    i = offset + 1
    for rec in records:
        rows.append({"id": rec.id, "school_no": rec.school_no, "school_name": rec.school_name,
                     "address": rec.address, "rem_code": rec.rem_code, "zipcode": rec.zipcode,
                     'manager': rec.manager, 'tel': rec.tel, 'manager_phone': rec.manager_phone,
                     'remark': rec.remark, 'recorder': rec.recorder, 'no': i
                     })
        i += 1
    return jsonify({"total": total, "rows": rows, 'errorCode': 0, 'msg': 'ok'})


@app.route('/dance_school_list_get', methods=['POST'])
@login_required
def dance_school_list_get():
    records = DanceSchool.query.filter_by(company_id=g.user.company_id)
    ret = []
    for rec in records:
        ret.append({'school_id': rec.id, 'school_name': rec.school_name, 'school_no': rec.school_no})

    return jsonify(ret)


@app.route('/dance_school_update', methods=['POST'])
@login_required
def dance_school_update():
    json_data = request.form['data']
    obj_data = json.loads(json_data)

    new_id = 0
    for i in range(len(obj_data)):
        if obj_data[i]['id'] <= 0:
            # add record
            if new_id == 0:
                rec = DanceSchool.query.filter_by(company_id=g.user.company_id).order_by(
                    DanceSchool.school_no.desc()).first()
                if rec is not None:
                    new_id = int(rec.school_no) + 1
                else:
                    new_id += 1
            else:
                new_id += 1
            school = DanceSchool(obj_data[i]['row'])
            school.school_no = '%04d' % new_id
            db.session.add(school)

            # 增加 用户 管理 分校 的权限
            sc = DanceSchool.query.filter_by(company_id=g.user.company_id).filter_by(
                school_no=school.school_no).first()
            g.user.add_relationship2school(sc.id)
        else:
            # update record
            school = DanceSchool.query.filter_by(id=obj_data[i]['id']).first()
            if school is None:
                continue
            school.update_data(obj_data[i]['row'])
            db.session.add(school)
    db.session.commit()

    return jsonify({'errorCode': 0, 'msg': 'school information update success!'})


@app.route('/dance_school_query', methods=['POST'])
@login_required
def dance_school_query():
    json_data = request.form['condition']

    ret = []
    records = DanceSchool.query.filter_by(company_id=g.user.company_id).order_by(DanceSchool.school_no.asc()).filter(
        DanceSchool.school_name.like('%'+json_data + '%'))
    for rec in records:
        ret.append({'value': rec.school_name, 'text': rec.school_name, 'errorCode': 0, 'msg': 'ok'})

    return jsonify(ret)


@app.route('/dance_user_get', methods=['POST'])
@login_required
def dance_user_get():
    page_size = int(request.form['rows'])
    page_no = int(request.form['page'])
    condition = request.form['condition']

    print '[dance_user_get]: page_size=', page_size, ' page_no=', page_no
    if page_no <= 0:    # 补丁
        page_no = 1
    rows = []
    if condition == '':
        total = DanceUser.query.filter_by(company_id=g.user.company_id).count()
    else:
        total = DanceUser.query.filter_by(company_id=g.user.company_id).filter(
            DanceUser.name.like('%'+condition+'%')).count()

    offset = (page_no - 1) * page_size
    records = DanceUser.query.order_by(
        DanceUser.user_no.asc(), DanceUser.name).filter_by(company_id=g.user.company_id).filter(
        DanceUser.name.like('%'+condition+'%')).limit(page_size).offset(offset)
    i = offset + 1
    for rec in records:
        # 查询 用户 可以管理的 分校
        school_list = DanceSchool.query.join(DanceUserSchool).filter(DanceUserSchool.user_id == rec.id).all()
        school_id = []
        school_name = []
        for sc in school_list:
            school_id.append(str(sc.id))
            school_name.append(sc.school_name)

        # 组装输出信息-- 用户信息
        rows.append({"id": rec.id, "user_no": 'USER-%03d' % int(rec.user_no), "name": rec.name,
                     "pwd": '********', "phone": rec.phone, "role_id": str(rec.role_id),
                     'recorder': rec.recorder, 'no': i,
                     'school_name': ','.join(school_name), 'school_id': ','.join(school_id)
                     })
        i += 1
    return jsonify({"total": total, "rows": rows, 'errorCode': 0, 'msg': 'ok'})


@app.route('/dance_user_update', methods=['POST'])
@login_required
def dance_user_update():
    json_data = request.form['data']
    obj_data = json.loads(json_data)

    new_id = 0
    for i in range(len(obj_data)):
        if obj_data[i]['id'] <= 0:
            # add record 新增用户
            if new_id == 0:
                rec = DanceUser.query.filter_by(company_id=g.user.company_id).order_by(DanceUser.user_no.desc()).first()
                if rec is not None:
                    new_id = int(rec.user_no) + 1
                else:
                    new_id += 1
            else:
                new_id += 1
            # 查询是否存在重名用户，若存在，返回错误
            is_exist = DanceUser.query.filter_by(company_id=g.user.company_id).filter_by(
                name=obj_data[i]['row']['name']).first()
            if is_exist is not None:
                return jsonify({'errorCode': ERROR_CODE_USER_IS_EXIST,
                                'msg': ERROR_MSG_USER_IS_EXIST % obj_data[i]['row']['name']})

            user = DanceUser(obj_data[i]['row'])
            user.recorder = g.user.name
            user.user_no = str(new_id)
            db.session.add(user)
        else:
            # update record
            user = DanceUser.query.filter_by(id=obj_data[i]['id']).first()
            if user is None:
                continue
            user.update_data(obj_data[i]['row'])
            db.session.add(user)
            user.update_relationship2school(obj_data[i]['row'])
    db.session.commit()

    return jsonify({'errorCode': 0, 'msg': 'user information update success!'})


@app.route('/dance_user_query', methods=['POST'])
@login_required
def dance_user_query():
    json_data = request.form['condition']

    ret = []
    records = DanceUser.query.filter_by(company_id=g.user.company_id).order_by(
        DanceUser.user_no.asc()).filter(DanceUser.name.like('%'+json_data + '%'))
    for rec in records:
        ret.append({'value': rec.name, 'text': rec.name})

    return jsonify(ret)
