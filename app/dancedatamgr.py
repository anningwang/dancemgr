# -*- coding:utf-8 -*-
from flask import render_template, flash, redirect, session, url_for, request, g, jsonify
from flask_login import login_user, logout_user, current_user, login_required
from app import app, db, lm, oid, babel
from models import DanceSchool
import json


@app.route('/dance_school_get', methods=['POST'])
def dance_school_get():
    page_size = int(request.form['rows'])
    page_no = int(request.form['page'])
    condition = request.form['condition']

    print '[dance_get_school]: page_size=', page_size, ' page_no=', page_no
    if page_no <= 0:    # 补丁
        page_no = 1
    rows = []
    total = DanceSchool.query.count()
    offset = (page_no - 1) * page_size
    records = DanceSchool.query.order_by(
        DanceSchool.school_no.asc(), DanceSchool.school_name).filter(
        DanceSchool.school_name.like('%'+condition+'%')).limit(page_size).offset(offset)
    i = offset + 1
    for rec in records:
        rows.append({"id": rec.id, "school_no": rec.school_no, "school_name": rec.school_name,
                     "address": rec.address, "rem_code": rec.rem_code, "zipcode": rec.zipcode,
                     'manager': rec.manager, 'tel': rec.tel, 'manager_phone': rec.manager_phone,
                     'remark': rec.remark, 'recorder': rec.recorder, 'no': i
                     })
        i += 1
    return jsonify({"total": total, "rows": rows})


@app.route('/dance_school_update', methods=['POST'])
def dance_school_update():
    json_data = request.form['data']
    obj_data = json.loads(json_data)

    new_id = 0
    for i in range(len(obj_data)):
        if obj_data[i]['id'] <= 0:
            # add record
            if new_id == 0:
                rec = DanceSchool.query.order_by(DanceSchool.school_no.desc()).first()
                if rec is not None:
                    new_id = int(rec.school_no) + 1
                else:
                    new_id += 1
            else:
                new_id += 1
            school = DanceSchool(obj_data[i]['row'])
            school.recorder = 'WXG'
            school.school_no = '%04d' % new_id
            db.session.add(school)
        else:
            # update record
            school = DanceSchool.query.filter_by(id=obj_data[i]['id']).first()
            if school is None:
                continue
            school.update_data(obj_data[i]['row'])
            db.session.add(school)
    db.session.commit()

    return jsonify({'ErrorCode': 0, 'MSG': 'school information update success!'})


@app.route('/dance_school_query', methods=['POST'])
def dance_school_query():
    json_data = request.form['condition']

    ret = []
    records = DanceSchool.query.order_by(
        DanceSchool.school_no.asc()).filter(DanceSchool.school_name.like('%'+json_data + '%'))
    for rec in records:
        ret.append({'value': rec.school_name, 'text': rec.school_name})

    return jsonify(ret)
