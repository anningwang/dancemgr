# -*- coding:utf-8 -*-
from flask import render_template, flash, redirect, session, url_for, request, g, jsonify
from flask_login import login_user, logout_user, current_user, login_required
from app import app, db, lm, oid, babel
from models import DanceSchool


@app.route('/dance_get_school', methods=['POST'])
def dance_get_school():
    page_size = int(request.form['rows'])
    page_no = int(request.form['page'])
    print '[dance_get_school]: page_size=', page_size, ' page_no=', page_no
    if page_no <= 0:    # 补丁
        page_no = 1
    rows = []
    total = DanceSchool.query.count()
    offset = (page_no - 1) * page_size
    records = DanceSchool.query.order_by(DanceSchool.school_no.asc(),
                                         DanceSchool.school_name).limit(page_size).offset(offset)
    i = offset + 1
    for rec in records:
        rows.append({"id": rec.id, "school_no": rec.school_no, "school_name": rec.school_name,
                     "address": rec.address, "rem_code": rec.rem_code, "zipcode": rec.zipcode,
                     'manager': rec.manager, 'tel': rec.tel, 'manager_phone': rec.manager_phone,
                     'remark': rec.remark, 'recorder': rec.recorder, 'no': i
                     })
        i += 1
    return jsonify({"total": total, "rows": rows})
