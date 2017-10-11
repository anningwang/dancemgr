# -*- coding:utf-8 -*-
from flask import request, jsonify, g
from flask_login import login_required
from app import app, db
from models import DanceSchool, DanceUser, DanceUserSchool, DcFeeItem, DanceReceipt, DanceStudent, DcTeachingMaterial,\
    DanceClassReceipt, DanceTeaching, DanceOtherFee, DanceClass, DanceStudentClass, DcShowRecpt, DcCommFeeMode,\
    DcShow, DcShowFeeCfg, DcShowDetailFee, DcClassType, DanceTeacher, DanceTeacherEdu, DanceTeacherWork, DcCommon
from views import dance_student_query
import json
import datetime
import tools.excel
from tools.tools import dc_records_changed, is_float
from dcglobal import *


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

            if 'school_id' in obj_data[i]['row']:
                school_ids = obj_data[i]['row']['school_id'].split(',')
                for sc_id in school_ids:
                    user.add_relationship2school(sc_id)
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


@app.route('/dance_fee_item_get', methods=['POST'])
@login_required
def dance_fee_item_get():
    """
    查询收费项目
    输入参数：
    {
        condition:      查询条件
    }
    :return:
    {
        total:          记录总条数
        rows: [{
            fee_item:   收费项目名称
            type:       收费项目类型
            type_text:  非数据库字段。+++
            create_at:  创建时间
            recorder:   记录员
            no:         记录顺序号
        }]
        errorCode:      错误码
        msg:            错误信息
            ----------------    ----------------------------------------------
            errorCode           msg
            ----------------    ----------------------------------------------
            0                   'ok'
    }
    """
    page_size = int(request.form['rows'])
    page_no = int(request.form['page'])
    if page_no <= 0:    # 补丁
        page_no = 1

    dcq = DcFeeItem.query.filter_by(company_id=g.user.company_id)
    if 'condition' in request.form and request.form['condition'] != '':
        dcq = dcq.filter(DcFeeItem.fee_item.like('%'+request.form['condition']+'%'))

    total = dcq.count()
    offset = (page_no - 1) * page_size
    records = dcq.order_by(DcFeeItem.type, DcFeeItem.id).limit(page_size).offset(offset)
    i = offset + 1
    rows = []
    for rec in records:
        rows.append({'no': i, 'id': rec.id, "fee_item": rec.fee_item, 'recorder': rec.recorder,
                     'create_at': datetime.datetime.strftime(rec.create_at, '%Y-%m-%d %H:%M:%S'),
                     'type': rec.type, 'type_text': get_feename(rec.type)
                     })   # 类型名称字段: 1 学费， 2  演出 ， 3，普通
        i += 1
    return jsonify({"total": total, "rows": rows, 'errorCode': 0, 'msg': 'ok'})


@app.route('/dance_fee_item_update', methods=['POST'])
@login_required
def dance_fee_item_update():
    """
    更新 收费项目。 包括新增 和 修改
    输入参数
        data:[{         输入参数
                id:             收费项目id, 大于0 - 修改， 0 - 新增
                row:{           收费项目记录
                    fee_item:   收费项目名称
                    }
            }]
    :return:
        errorCode:      错误码
            0       成功
        msg:            错误信息
    """
    if 'data' not in request.form:
        return jsonify({'errorCode': 600, 'msg': 'Parameter error. [data] required.'})
    json_str = request.form['data']
    obj = json.loads(json_str)
    for fee in obj:
        if 'type' in fee['row']:
            fee_type = fee['row']['type']
            try:
                fee_type = int(fee_type)
            except ValueError:
                return jsonify({'errorCode': 802,
                                'msg': u'输入类型错误!合法值[1~3]，输入值[%s]' % fee['row']['type']})
        else:
            fee_type = 1
        if 'id' not in fee or fee['id'] <= 0:
            fee_item = fee['row']['fee_item']
            # 收费名称不能重复，查询是否有重复记录
            dup = DcFeeItem.query.filter_by(company_id=g.user.company_id)\
                .filter_by(fee_item=fee_item, type=fee_type).first()
            if dup is not None:
                return jsonify({'errorCode': 801,
                                'msg': u'名称为 [%s], 类型为 [%s] 的收费项目已经存在！' %
                                       (fee_item, get_feename(fee_type))})
            nr = DcFeeItem(fee_item, fee_type)
            db.session.add(nr)
        else:
            nr = DcFeeItem.query.get(fee['id'])
            if nr is not None:
                nr.update(fee['row'])
                db.session.add(nr)

    db.session.commit()
    return jsonify({'errorCode': 0, 'msg': u'更新成功！'})


@app.route('/dance_fee_item_query', methods=['POST'])
@login_required
def dance_fee_item_query():
    name = request.form['condition']

    ret = []
    records = DcFeeItem.query.filter_by(company_id=g.user.company_id)\
        .order_by(DcFeeItem.id.asc()).filter(DcFeeItem.fee_item.like('%'+name + '%'))
    for rec in records:
        ret.append({'value': rec.fee_item, 'text': rec.fee_item})

    return jsonify(ret)


@app.route('/dance_receipt_study_query', methods=['POST'])
@login_required
def dance_receipt_study_query():
    return dance_student_query()


@app.route('/dance_receipt_study_get', methods=['POST'])
@login_required
def dance_receipt_study_get():
    page_size = int(request.form['rows'])
    page_no = int(request.form['page'])
    if page_no <= 0:    # 补丁
        page_no = 1

    dcq = DanceReceipt.query

    school_ids = DanceUserSchool.get_school_ids_by_uid()
    if 'school_id' not in request.form or request.form['school_id'] == 'all':
        school_id_intersection = school_ids
    else:
        school_id_intersection = list(set(school_ids).intersection(set(map(int, request.form['school_id']))))
    if len(school_id_intersection) == 0:
        return jsonify({'errorCode': 600, 'msg': u'您没有管理分校的权限！'})
    dcq = dcq.filter(DanceReceipt.school_id.in_(school_id_intersection))

    dcq = dcq.join(DanceStudent, DanceStudent.id == DanceReceipt.student_id)
    if 'name' in request.form and request.form['name'] != '':
        name = request.form['name']
        if name.encode('UTF-8').isalpha():
            dcq = dcq.filter(DanceStudent.rem_code.like('%' + name + '%'))
        else:
            dcq = dcq.filter(DanceStudent.name.like('%' + name + '%'))

    total = dcq.count()
    offset = (page_no - 1) * page_size
    records = dcq.join(DanceSchool, DanceSchool.id == DanceReceipt.school_id)\
        .add_columns(DanceSchool.school_name, DanceStudent.sno, DanceStudent.name)\
        .order_by(DanceReceipt.id.desc()).limit(page_size).offset(offset).all()
    i = offset + 1
    rows = []
    for dcr in records:
        rec = dcr[0]
        rows.append({'no': i, 'id': rec.id, "receipt_no": rec.receipt_no, 'recorder': rec.recorder,
                     'deal_date': datetime.datetime.strftime(rec.deal_date, '%Y-%m-%d'),
                     'receivable_fee': rec.receivable_fee,
                     'teaching_fee': rec.teaching_fee,
                     'other_fee': rec.other_fee,
                     'total': rec.total,
                     'real_fee': rec.real_fee,
                     'arrearage': rec.arrearage,
                     'counselor': rec.counselor,
                     'remark': rec.remark,
                     'fee_mode': rec.fee_mode,
                     'school_name': dcr[1], 'student_sno': dcr[2], 'student_name': dcr[3]
                     })
        i += 1
    return jsonify({"total": total, "rows": rows, 'errorCode': 0, 'msg': 'ok'})


@app.route('/dance_receipt_study_details_get', methods=['POST'])
@login_required
def dance_receipt_study_details_get():
    """
    查询 收费单（学费） 详细信息
        查询条件：rows          每页显示的条数
                  page          页码，第几页，从1开始
                                特殊值 -2，表示根据 receipt_id 查询，并求出该 收费单 的序号
                  receipt_id    收费单id, optional, 当 page==-2,必填
                  school_id     分校ID
                  is_training   是否在读
                  name          学员姓名过滤条件
    :return:     收费单的详细信息，包括班级——学费，教材费和其他费
                  errorCode     错误码
                  msg           错误信息
                  row           收费单基本信息
                  total         收费单记录条数 == 1
                  class_receipt 收费单 关联的 班级收费列表
                  teach_receipt 教材费
                  cls           学员已报班信息
                    {'class_id':
                    'class_no':
                    'class_name':
                    'cost_mode':
                     'cost': }
    :return:
    """
    page_size = int(request.form['rows'])
    page_no = int(request.form['page'])

    dcq = DanceReceipt.query

    school_ids = DanceUserSchool.get_school_ids_by_uid()
    if 'school_id' not in request.form or request.form['school_id'] == 'all':
        school_id_intersection = school_ids
    else:
        school_id_intersection = list(set(school_ids).intersection(set(map(int, request.form['school_id']))))
    if len(school_id_intersection) == 0:
        return jsonify({'errorCode': 600, 'msg': u'您没有管理分校的权限！'})
    dcq = dcq.filter(DanceReceipt.school_id.in_(school_id_intersection))

    total = dcq.count()

    if page_no <= -2:
        # 根据 id 获取 收费单 详细信息，并求出其序号。
        rid = int(request.form['receipt_id'])
        r = DanceReceipt.query.get(rid)
        if r is None:
            return jsonify({'errorCode': 400, 'msg': u'不存在id为[%s]的收费单！' % rid})
        rec_no = dcq.filter(DanceReceipt.id >= r.id).count()
    else:
        if page_no <= 0:  # 容错处理
            page_no = 1
        offset = (page_no - 1) * page_size
        r = dcq.order_by(DanceReceipt.id.desc()).limit(page_size).offset(offset).first()
        if r is None:
            return jsonify({'errorCode': 400, 'msg': u'不存在id为[%s]的收费单！' % request.form['receipt_id']})
        rec_no = offset + 1

    """ 根据学员id查询学员姓名和编号、所在学员名称和学校编号"""
    stu = DanceStudent.query.filter(DanceStudent.id == r.student_id)\
        .join(DanceSchool, DanceStudent.school_id == DanceSchool.id)\
        .add_columns(DanceSchool.school_name, DanceSchool.school_no).first()

    """ 收费单 基本信息 """
    row = {'id': r.id, 'receipt_no': r.receipt_no, 'school_id': r.school_id,
           'student_id': r.student_id, 'deal_date': datetime.datetime.strftime(r.deal_date, '%Y-%m-%d'),
           'receivable_fee': r.receivable_fee, 'teaching_fee': r.teaching_fee, 'other_fee': r.other_fee,
           'total': r.total, 'real_fee': r.real_fee, 'arrearage': r.arrearage,
           'counselor': r.counselor, 'remark': r.remark, 'recorder': r.recorder,
           'no': rec_no, 'school_no': stu[2], 'school_name': stu[1],
           'student_no': stu[0].sno, 'student_name': stu[0].name,
           'fee_mode': r.fee_mode, 'paper_receipt': r.paper_receipt, 'type': r.type}

    """ 查询班级——学费 """
    clsfee = DanceClassReceipt.query.filter_by(receipt_id=r.id)\
        .join(DanceClass, DanceClass.id == DanceClassReceipt.class_id)\
        .add_columns(DanceClass.cno, DanceClass.class_name, DanceClass.cost_mode, DanceClass.cost, DanceClass.id)\
        .all()
    class_receipt = []
    for cf in clsfee:
        c = cf[0]
        class_receipt.append({'id': c.id, 'class_name': cf[2], 'cost_mode': cf[3],
                              'cost': cf[4], 'term': c.term, 'sum': c.sum,
                              'discount': c.discount, 'discount_rate': c.discount_rate, 'total': c.total,
                              'real_fee': c.real_fee, 'arrearage': c.arrearage, 'remark': c.remark,
                              'class_no': cf[1], 'class_id': cf[5],
                              'discRateText': str(c.discount_rate*100)+'%' if c.discount_rate is not None else '',
                              })
    """ 查询 教材费 """
    teachfee = DanceTeaching.query.filter_by(receipt_id=r.id)\
        .join(DcTeachingMaterial, DcTeachingMaterial.id == DanceTeaching.material_id)\
        .add_columns(DcTeachingMaterial.material_name, DcTeachingMaterial.material_no, DcTeachingMaterial.unit,
                     DcTeachingMaterial.price_sell).all()
    teach = []
    for tf in teachfee:
        t = tf[0]
        class_name = ''
        class_no = ''
        if t.class_id != '':
            cls = DanceClass.query.get(t.class_id)
            if cls is not None:
                class_name = cls.class_name
                class_no = cls.cno
        teach.append({'id': t.id, 'class_name': class_name, 'class_no': class_no,
                      'is_got': t.is_got, 'fee': t.fee, 'remark': t.remark,
                      'tm_id': t.material_id, 'tm_name': tf[1], 'tm_no': tf[2],
                      'class_id': t.class_id, 'material_id': t.material_id, 'dt_num': t.dt_num,
                      'tm_unit': tf[3], 'tm_price_sell': tf[4]})

    """ 查询 其他费 """
    othfee = DanceOtherFee.query.filter_by(receipt_id=r.id).join(DcFeeItem, DcFeeItem.id == DanceOtherFee.fee_item_id).\
        add_columns(DcFeeItem.fee_item).all()
    other_fee = []
    for of in othfee:
        o = of[0]
        class_name = ''
        class_no = ''
        if o.class_id != '':
            cls = DanceClass.query.get(o.class_id)
            if cls is not None:
                class_name = cls.class_name
                class_no = cls.cno
        other_fee.append({'id': o.id, 'class_name': class_name, 'class_no': class_no,
                          'fee_item': of[1], 'fee_item_id': o.fee_item_id, 'summary': o.summary,
                          'real_fee': o.real_fee, 'remark': o.remark})

    """ 查询学员已报班信息 """
    student_no = stu[0].sno
    records = DanceStudentClass.query.filter_by(student_id=student_no).filter_by(company_id=g.user.company_id)\
        .join(DanceClass, DanceStudentClass.class_id == DanceClass.cno).filter(DanceStudentClass.status == u'正常')\
        .add_columns(DanceClass.id, DanceClass.cno, DanceClass.class_name, DanceClass.cost_mode, DanceClass.cost).all()
    cls = []
    for rec in records:
        cls.append({'class_id': rec[1], 'class_no': rec[2], 'class_name': rec[3],
                    'cost_mode': rec[4], 'cost': rec[5]})

    return jsonify({"total": total, "row": row, 'errorCode': 0, 'msg': 'ok', 'class_receipt': class_receipt,
                    'teach_receipt': teach, 'other_fee': other_fee, 'cls': cls})


@app.route('/dance_receipt_study_details_extras', methods=['POST'])
@login_required
def dance_receipt_study_details_extras():
    """
    收费单（学费） 详细信息页面，查询附加信息：
        1. 包括学员所在分校的可报班级（班级编号、班级名称、班级类别、收费模式、收费标准）
        2. 分校id, 分校名称 列表
        输入参数：
            student_id      学员id --- 未使用
            school_id       分校id， all 或者 具体 id
    :return:  {'classlist' : [{'class_no':  '班级编号',
                        'class_name':  '班级名称',
                        'class_type': '班级类别',   舞蹈，跆拳道，美术，...
                        'cost_mode': '收费模式',    1-按课次  2-按课时
                        'cost': '收费标准'
                        'class_id': 班级id
                        }],
                'schoollist': [{'school_id': '分校id',
                        'school_name': '分校名称',
                        'school_no': '分校编号'}]
                }
    """
    dcq = DanceClass.query.filter(DanceClass.is_ended == 0)

    """
    if 'student_id' in request.form:
        stu = DanceStudent.query.get(request.form['student_id'])
        if stu is not None:
            dcq = dcq.filter(DanceClass.school_id == stu.school_id)
    """

    school_ids = DanceUserSchool.get_school_ids_by_uid()
    if 'school_id' not in request.form or request.form['school_id'] == 'all':
        school_id_intersection = school_ids
    else:
        school_id_intersection = list(set(school_ids).intersection(set(map(int, request.form['school_id']))))

    if len(school_id_intersection) == 0:
        return jsonify({'errorCode': 600, 'msg': u'您没有管理分校的权限！'})
    dcq = dcq.filter(DanceClass.school_id.in_(school_id_intersection))
    records = dcq.order_by(DanceClass.id.desc()).all()

    classes = []
    for cls in records:
        classes.append({'class_no': cls.cno, 'class_name': cls.class_name, 'class_type': cls.class_type,
                        'cost_mode': cls.cost_mode, 'cost': cls.cost, 'class_id': cls.id})

    schoollist = []
    school_rec = DanceSchool.query.filter(DanceSchool.id.in_(school_id_intersection)).all()
    for sc in school_rec:
        schoollist.append({'school_id': sc.id, 'school_name': sc.school_name, 'school_no': sc.school_no})

    return jsonify({'classlist': classes, 'schoollist': schoollist, 'errorCode': 0, 'msg': 'ok'})


@app.route('/dance_receipt_study_modify', methods=['POST'])
@login_required
def dance_receipt_study_modify():
    """
    新增/更新 收费单（学费）。
    输入参数：
        {row: {},                   收费单基本信息
        class_receipt: Array,       班级——学费
        teach_receipt: Array,       教材费
        other_fee: Array}           其他费
    :return:
        {errorCode :  0  or 其他。 0 表示成功
            301     收费单记录id不存在！
        msg : 'ok' or 其他错误
        }
    """
    json_str = request.form['data']
    obj = json.loads(json_str)
    if 'row' not in obj or 'class_receipt' not in obj or 'teach_receipt' not in obj or 'other_fee' not in obj:
        return jsonify({'errorCode': 202, 'msg': u'参数错误！'})
    if 'id' not in obj['row'] or obj['row']['id'] <= 0:
        return dance_receipt_study_add(obj)     # 新增记录

    # 修改记录
    """ 修改收费单 基本情况 """
    recpt_id = obj['row']['id']
    re = DanceReceipt.query.get(recpt_id)
    if re is None:
        return jsonify({'errorCode': 301, 'msg': u'收费单记录id[%d]不存在！' % recpt_id})
    re.update(obj['row'])
    db.session.add(re)

    """ 修改 班级——学费 """
    cls = obj['class_receipt']
    records = DanceClassReceipt.query.filter_by(receipt_id=recpt_id).all()
    old_ids = []
    for rec in records:
        old_ids.append({'id': rec.id})
    change = dc_records_changed(old_ids, cls, 'id')
    for i in change['add']:
        cls[i]['receipt_id'] = recpt_id
        nr = DanceClassReceipt(cls[i])
        db.session.add(nr)
    for i in change['upd']:
        nr = DanceClassReceipt.query.get(cls[i]['id'])
        nr.update(cls[i])
        db.session.add(nr)
    for i in change['del']:
        DanceClassReceipt.query.filter_by(id=old_ids[i]['id']).delete()

    """ 修改 教材费 """
    dt = obj['teach_receipt']
    records = DanceTeaching.query.filter_by(receipt_id=recpt_id).all()
    old_ids = []
    for rec in records:
        old_ids.append({'id': rec.id})
    change = dc_records_changed(old_ids, dt, 'id')
    for i in change['add']:
        dt[i]['receipt_id'] = recpt_id
        nr = DanceTeaching(dt[i])
        db.session.add(nr)
    for i in change['upd']:
        nr = DanceTeaching.query.get(dt[i]['id'])
        nr.update(dt[i])
        db.session.add(nr)
    for i in change['del']:
        DanceTeaching.query.filter_by(id=old_ids[i]['id']).delete()

    """ 修改 其他费 """
    oth = obj['other_fee']
    records = DanceOtherFee.query.filter_by(receipt_id=recpt_id).all()
    old_ids = []
    for rec in records:
        old_ids.append({'id': rec.id})
    change = dc_records_changed(old_ids, oth, 'id')
    for i in change['add']:
        oth[i]['receipt_id'] = recpt_id
        nr = DanceOtherFee(oth[i])
        db.session.add(nr)
    for i in change['upd']:
        nr = DanceOtherFee.query.get(oth[i]['id'])
        nr.update(oth[i])
        db.session.add(nr)
    for i in change['del']:
        DanceOtherFee.query.filter_by(id=old_ids[i]['id']).delete()

    db.session.commit()
    return jsonify({'errorCode': 0, 'msg': u'更新成功！'})


def dance_receipt_study_add(recpt):
    """
    新增 收费单（学费）
    :param recpt:   收费单信息，记录参数同 dance_receipt_study_modify
    :return:
        {errorCode :  0  表示成功
        msg : '成功增加记录！'
        }
    """
    new_r = DanceReceipt(recpt['row'])
    db.session.add(new_r)

    r = DanceReceipt.query.filter(DanceReceipt.receipt_no == new_r.receipt_no,
                                  DanceReceipt.school_id == recpt['row']['school_id']).first()
    print r.id, r.receipt_no
    for cr in recpt['class_receipt']:
        cr['receipt_id'] = r.id
        new_cr = DanceClassReceipt(cr)
        db.session.add(new_cr)
    for tr in recpt['teach_receipt']:
        tr['receipt_id'] = r.id
        new_tr = DanceTeaching(tr)
        db.session.add(new_tr)
    for other in recpt['other_fee']:
        other['receipt_id'] = r.id
        new_other = DanceOtherFee(other)
        db.session.add(new_other)

    db.session.commit()
    return jsonify({'errorCode': 0, 'msg': u'成功增加记录！', 'id': r.id})


@app.route('/dance_teaching_material_get', methods=['POST'])
@login_required
def dance_teaching_material_get():
    page_size = int(request.form['rows'])
    page_no = int(request.form['page'])
    if page_no <= 0:    # 补丁
        page_no = 1

    dcq = DcTeachingMaterial.query.filter_by(company_id=g.user.company_id)

    if 'condition' in request.form and request.form['condition'] != '':
        dcq = dcq.filter(DcTeachingMaterial.material_name.like('%'+request.form['condition']+'%'))

    total = dcq.count()

    offset = (page_no - 1) * page_size
    records = dcq.order_by(DcTeachingMaterial.id).limit(page_size).offset(offset)
    i = offset + 1
    rows = []
    for rec in records:
        rows.append({'no': i, 'id': rec.id, "material_no": rec.material_no, 'material_name': rec.material_name,
                     'unit': rec.unit, 'price_buy': rec.price_buy, 'price_sell': rec.price_sell,
                     'summary': rec.summary, 'is_use': rec.is_use, 'remark': rec.remark,
                     'recorder': rec.recorder, 'tm_type': rec.tm_type
                     })
        i += 1
    return jsonify({"total": total, "rows": rows, 'errorCode': 0, 'msg': 'ok'})


@app.route('/dance_teaching_material_query', methods=['POST'])
@login_required
def dance_teaching_material_query():
    name = request.form['condition']

    ret = []
    records = DcTeachingMaterial.query.filter_by(company_id=g.user.company_id)\
        .order_by(DcTeachingMaterial.id.asc()).filter(DcTeachingMaterial.material_name.like('%'+name + '%'))
    for rec in records:
        ret.append({'value': rec.material_name, 'text': rec.material_name})

    return jsonify(ret)


@app.route('/dance_receipt_show_query', methods=['POST'])
@login_required
def dance_receipt_show_query():
    """ 根据姓名或者 姓名拼音 查询 符合条件的学员 """
    return dance_student_query()


@app.route('/dance_receipt_show_get', methods=['POST'])
@login_required
def dance_receipt_show_get():
    """
    查询收费单（演出）基本信息。界面：收费单（演出）   列表
        输入参数：
            rows:       需要返回的每页记录条数
            page:       页码
            school_id:  分校id
            name:       查询条件，学员姓名或者姓名拼音首字母
    :return:
        total       符合条件的总记录条数
        rows        记录。list。
            show_recpt_no   演出收费单编号
            show_name       演出名称
            school_name     分校名称
            student_no      学号
            student_name    学员姓名
            deal_date       收费日期
            join_fee        报名费
            other_fee       其他费
            total           费用合计
            fee_mode        收费方式
            remark          备注
            recorder        录入员
        errorCode   错误码，0，正确，其他错误
        msg         错误信息。 'ok' -- 正确
    """
    page_size = int(request.form['rows'])
    page_no = int(request.form['page'])
    if page_no <= 0:    # 补丁
        page_no = 1

    dcq = DcShowRecpt.query

    school_ids = DanceUserSchool.get_school_ids_by_uid()
    if 'school_id' not in request.form or request.form['school_id'] == 'all':
        school_id_intersection = school_ids
    else:
        school_id_intersection = list(set(school_ids).intersection(set(map(int, request.form['school_id']))))
    if len(school_id_intersection) == 0:
        return jsonify({'errorCode': 600, 'msg': u'您没有管理分校的权限！'})
    dcq = dcq.filter(DcShowRecpt.school_id.in_(school_id_intersection))

    dcq = dcq.join(DanceStudent, DanceStudent.id == DcShowRecpt.student_id)
    if 'name' in request.form and request.form['name'] != '':
        name = request.form['name']
        if name.encode('UTF-8').isalpha():
            dcq = dcq.filter(DanceStudent.rem_code.like('%' + name + '%'))
        else:
            dcq = dcq.filter(DanceStudent.name.like('%' + name + '%'))

    total = dcq.count()
    offset = (page_no - 1) * page_size
    records = dcq.join(DanceSchool, DanceSchool.id == DcShowRecpt.school_id)\
        .join(DcCommFeeMode, DcCommFeeMode.id == DcShowRecpt.fee_mode_id)\
        .add_columns(DanceSchool.school_name,
                     DanceStudent.sno,
                     DanceStudent.name,
                     DcCommFeeMode.fee_mode)\
        .order_by(DcShowRecpt.id.desc()).limit(page_size).offset(offset).all()
    i = offset + 1

    show_rec = DcShowDetailFee.query.join(DcShow, DcShow.id == DcShowDetailFee.show_id)\
        .filter(DcShow.company_id == g.user.company_id)\
        .group_by(DcShowDetailFee.recpt_id, DcShowDetailFee.show_id)\
        .add_columns(DcShow.show_name).all()
    shows = {}
    for sr in show_rec:
        if sr[0].recpt_id in shows:
            shows[sr[0].recpt_id].append(sr[1])
        else:
            shows[sr[0].recpt_id] = [sr[1]]

    rows = []
    for dcr in records:
        rec = dcr[0]
        rows.append({'no': i, 'id': rec.id, "show_recpt_no": rec.show_recpt_no, 'recorder': rec.recorder,
                     'deal_date': datetime.datetime.strftime(rec.deal_date, '%Y-%m-%d'),
                     'join_fee': rec.join_fee, 'other_fee': rec.other_fee, 'total': rec.total,
                     'remark': rec.remark, 'last_upd_at': rec.last_upd_at,
                     'fee_mode_id': rec.fee_mode_id, 'fee_mode': dcr[4],
                     'school_name': dcr[1], 'student_no': dcr[2], 'student_name': dcr[3],
                     'paper_receipt': rec.paper_receipt,
                     'show_name': '' if rec.id not in shows else ','.join(shows[rec.id])
                     })
        i += 1
    return jsonify({"total": total, "rows": rows, 'errorCode': 0, 'msg': 'ok'})


@app.route('/dance_receipt_show_details_get', methods=['POST'])
@login_required
def dance_receipt_show_details_get():
    """
    查询 收费单（演出） 详细信息
        查询条件：rows          每页显示的条数
                  page          页码，第几页，从1开始
                                特殊值 -2，表示根据 receipt_id 查询，并求出该 收费单 的序号
                  recpt_id      收费单id, optional, 当 page==-2,必填
                  school_id     分校ID
                  is_training   是否在读
                  name          学员姓名过滤条件
    :return:     收费单的详细信息，包括班级——学费，教材费和其他费
                  errorCode     错误码
                    600         您没有管理分校的权限！
                    400         不存在id为[%s]的收费单！
                  msg           错误信息
                  row           收费单基本信息
                  total         收费单记录条数 == 1
                  showDetail    收费单 关联的 演出收费列表
                  cls           学员已报班信息
                    {'class_id':
                    'class_no':
                    'class_name':
                    }
    :return:
    """
    page_size = int(request.form['rows'])
    page_no = int(request.form['page'])

    dcq = DcShowRecpt.query

    school_ids = DanceUserSchool.get_school_ids_by_uid()
    if 'school_id' not in request.form or request.form['school_id'] == 'all':
        school_id_intersection = school_ids
    else:
        school_id_intersection = list(set(school_ids).intersection(set(map(int, request.form['school_id']))))
    if len(school_id_intersection) == 0:
        return jsonify({'errorCode': 600, 'msg': u'您没有管理分校的权限！'})
    dcq = dcq.filter(DcShowRecpt.school_id.in_(school_id_intersection))

    total = dcq.count()

    if page_no <= -2:
        # 根据 id 获取 收费单 详细信息，并求出其序号。
        rid = int(request.form['recpt_id'])
        r = DcShowRecpt.query.get(rid)
        if r is None:
            return jsonify({'errorCode': 400, 'msg': u'不存在id为[%s]的收费单！' % rid})
        rec_no = dcq.filter(DcShowRecpt.id >= r.id).count()
    else:
        if page_no <= 0:  # 容错处理
            page_no = 1
        offset = (page_no - 1) * page_size
        r = dcq.order_by(DcShowRecpt.id.desc()).limit(page_size).offset(offset).first()
        if r is None:
            return jsonify({'errorCode': 400, 'msg': u'不存在id为[%s]的收费单！' % request.form['receipt_id']})
        rec_no = offset + 1

    """ 根据学员id查询学员姓名和编号、所在学员名称和学校编号"""
    stu = DanceStudent.query.filter(DanceStudent.id == r.student_id)\
        .join(DanceSchool, DanceStudent.school_id == DanceSchool.id)\
        .add_columns(DanceSchool.school_name, DanceSchool.school_no).first()

    """ 根据 收费方式id 查询 收费方式"""
    fm = DcCommFeeMode.query.filter_by(id=r.fee_mode_id).first()
    fee_mode = '' if fm is None else fm.fee_mode

    """ 收费单 基本信息 """
    row = {'id': r.id, 'show_recpt_no': r.show_recpt_no, 'school_id': r.school_id,
           'student_id': r.student_id, 'deal_date': datetime.datetime.strftime(r.deal_date, '%Y-%m-%d'),
           'join_fee': r.join_fee, 'other_fee': r.other_fee, 'total': r.total,
           'remark': r.remark, 'recorder': r.recorder, 'no': rec_no,
           'school_no': stu[2], 'school_name': stu[1], 'paper_receipt': r.paper_receipt,
           'student_no': stu[0].sno, 'student_name': stu[0].name,
           'fee_mode': fee_mode, 'fee_mode_id': r.fee_mode_id}

    """ 查询 演出收费明细 """
    clsfee = DcShowDetailFee.query.filter_by(recpt_id=r.id)\
        .join(DcFeeItem, DcFeeItem.id == DcShowDetailFee.fee_item_id)\
        .join(DcShow, DcShow.id == DcShowDetailFee.show_id)\
        .add_columns(DcFeeItem.fee_item, DcShow.show_name, DcShow.begin_date)\
        .all()
    show_detail = []
    for cf in clsfee:
        c = cf[0]
        show_detail.append({'id': c.id, 'recpt_id': c.recpt_id, 'show_id': c.show_id, 'fee_item_id': c.fee_item_id,
                            'is_rcv': c.is_rcv, 'remark': c.remark, 'fee': c.fee,
                            'is_rcv_text': u'是' if c.is_rcv == 1 else u'否',
                            'show_name': cf[2], 'begin_date': cf[3], 'fee_item': cf[1]
                            })

    """ 查询学员已报班信息 """
    student_no = stu[0].sno
    records = DanceStudentClass.query.filter_by(student_id=student_no).filter_by(company_id=g.user.company_id)\
        .join(DanceClass, DanceStudentClass.class_id == DanceClass.cno).filter(DanceStudentClass.status == u'正常')\
        .add_columns(DanceClass.id, DanceClass.cno, DanceClass.class_name).all()
    cls = []
    for rec in records:
        cls.append({'class_id': rec[1], 'class_no': rec[2], 'class_name': rec[3]})

    return jsonify({"total": total, "row": row, 'errorCode': 0, 'msg': 'ok', 'showDetail': show_detail, 'cls': cls})


@app.route('/dance_receipt_show_modify', methods=['POST'])
@login_required
def dance_receipt_show_modify():
    """
     新增/更新 收费单（演出）。
     输入参数：
         {row: {},                  收费单基本信息
         showDetail: Array,         演出收费项目
     :return:
         {errorCode :  0  or 其他。 0 表示成功
             301     收费单记录id不存在！
         msg : 'ok' or 其他错误
         }
     """
    json_str = request.form['data']
    obj = json.loads(json_str)
    if 'row' not in obj or 'showDetail' not in obj:
        return jsonify({'errorCode': 202, 'msg': u'参数错误！'})
    if 'id' not in obj['row'] or obj['row']['id'] <= 0:
        return dance_receipt_show_add(obj)  # 新增记录

    # 修改记录
    """ 修改收费单 基本情况 """
    recpt_id = obj['row']['id']
    re = DcShowRecpt.query.get(recpt_id)
    if re is None:
        return jsonify({'errorCode': 301, 'msg': u'收费单记录id[%d]不存在！' % recpt_id})
    re.update(obj['row'])
    db.session.add(re)

    """ 修改 演出收费项目 """
    d = obj['showDetail']
    records = DcShowDetailFee.query.filter_by(recpt_id=recpt_id).all()
    old_ids = []
    for rec in records:
        old_ids.append({'id': rec.id})
    change = dc_records_changed(old_ids, d, 'id')
    for i in change['add']:
        d[i]['recpt_id'] = recpt_id
        nr = DcShowDetailFee(d[i])
        db.session.add(nr)
    for i in change['upd']:
        nr = DcShowDetailFee.query.get(d[i]['id'])
        nr.update(d[i])
        db.session.add(nr)
    for i in change['del']:
        DcShowDetailFee.query.filter_by(id=old_ids[i]['id']).delete()

    db.session.commit()
    return jsonify({'errorCode': 0, 'msg': u'更新成功！'})


def dance_receipt_show_add(recpt):
    """
    新增 收费单（演出）
    :param recpt:   收费单信息，记录参数同 dance_receipt_show_modify
    :return:
        {errorCode :  0  表示成功
        msg : '成功增加记录！'
        }
    """
    new_r = DcShowRecpt(recpt['row'])
    db.session.add(new_r)

    r = DcShowRecpt.query.filter(DcShowRecpt.show_recpt_no == new_r.show_recpt_no,
                                 DcShowRecpt.school_id == recpt['row']['school_id']).first()
    print r.id, r.show_recpt_no
    for cr in recpt['showDetail']:
        cr['recpt_id'] = r.id
        new_cr = DcShowDetailFee(cr)
        db.session.add(new_cr)

    db.session.commit()
    return jsonify({'errorCode': 0, 'msg': u'成功增加记录！', 'id': r.id})


@app.route('/dance_show_add', methods=['POST'])
@login_required
def dance_show_add():
    """
    新增 演出 信息
    输入参数：
        data    输入参数
            show        演出基本信息
            showCfg     演出包含的收费信息
    :return:
        errorCode   错误码
            0       成功
            600     参数错误，缺少 show 输入参数, msg 为 Parameter error. [data] required.
            601     参数错误，缺少 show 输入参数, msg 为 Parameter error. [show] required.
            602     参数错误，缺少 showCfg 输入参数, msg 为 Parameter error. [showCfg] required.
        msg         错误信息
            成功增加演出信息！      成功
    """
    if 'data' not in request.form:
        return jsonify({'errorCode': 600, 'msg': 'Parameter error. [data] required.'})
    json_str = request.form['data']
    obj = json.loads(json_str)
    if 'show' not in obj:
        return jsonify({'errorCode': 601, 'msg': 'Parameter error. [show] required.'})
    if 'showCfg' not in obj:
        return jsonify({'errorCode': 602, 'msg': 'Parameter error. [showCfg] required.'})

    show = obj['show']
    rec = DcShow(show)
    show_no = rec.show_no
    db.session.add(rec)

    r = DcShow.query.filter_by(company_id=g.user.company_id).filter_by(show_no=show_no).first()
    show_id = r.id

    """ 新增 演出收费项目 """
    for cfg in obj['showCfg']:
        fc = DcShowFeeCfg(show_id, cfg['fee_item_id'], cfg['cost'])
        db.session.add(fc)

    db.session.commit()
    return jsonify({'errorCode': 0, 'msg': '成功增加演出信息！'})


@app.route('/dance_teacher_get', methods=['POST', 'GET'])
@login_required
def dance_teacher_get():
    """
    查询 员工与老师 列表
        查询条件：rows          每页显示的条数
                  page          页码，第几页，从1开始
                  school_id     分校ID
                  in_job        是否在职
                  name          教职工姓名过滤条件
    :return:    符合条件的 教职工 列表
    {
        total:          记录数
        rows: [{
            id:
            name:       员工与老师姓名
        }]
        errorCode:      错误码
        msg:            错误信息
            ----------------    ----------------------------------------------
            errorCode           msg
            ----------------    ----------------------------------------------
            0                   'ok'
            600                 '您没有管理分校的权限！'
    }
    """
    page_size = int(request.form['rows'])
    page_no = int(request.form['page'])
    if page_no <= 0:    # 容错处理
        page_no = 1

    school_ids = DanceUserSchool.get_school_ids_by_uid()
    dcq = DanceTeacher.query.filter_by(company_id=g.user.company_id)
    if 'school_id' not in request.form or request.form['school_id'] == 'all':
        school_id_intersection = school_ids
    else:
        school_id_intersection = list(set(school_ids).intersection(set(map(int, request.form['school_id']))))
    if len(school_id_intersection) == 0:
        return jsonify({'errorCode': 600, 'msg': u'您没有管理分校的权限！'})
    dcq = dcq.filter(DanceTeacher.school_id.in_(school_id_intersection))

    if 'in_job' in request.form:
        dcq = dcq.filter_by(in_job=request.form['in_job'])

    if 'name' in request.form and request.form['name'] != '':
        dcq = dcq.filter(DanceTeacher.name.like('%' + request.form['name'] + '%'))

    total = dcq.count()
    offset = (page_no - 1) * page_size
    records = dcq.join(DanceSchool, DanceSchool.id == DanceTeacher.school_id)\
        .add_columns(DanceSchool.school_name, DanceSchool.school_no)\
        .order_by(DanceTeacher.school_id, DanceTeacher.id.desc())\
        .limit(page_size).offset(offset).all()
    i = offset + 1
    rows = []
    for rec in records:
        r = rec[0]
        leave_day = datetime.datetime.strftime(r.leave_day, '%Y-%m-%d') if r.leave_day is not None else None
        rows.append({"id": r.id, "teacher_no": r.teacher_no, "school_no": rec[2], 'no': i,
                     "school_name": rec[1], "name": r.name, "rem_code": r.rem_code, 'degree': r.degree,
                     'birthday': r.birthday, 'join_day': datetime.datetime.strftime(r.join_day, '%Y-%m-%d'),
                     'leave_day': leave_day,
                     'te_title': r.te_title, 'gender': u'男' if r.gender else u'女',
                     'te_type': teacher_type_s(r.te_type), 'in_job': u'是' if r.in_job else u'否',
                     'is_assist': u'是' if r.is_assist else u'否',
                     'has_class': u'是' if r.has_class else u'否',
                     'nation': r.nation,
                     'birth_place': r.birth_place, 'idcard': r.idcard, 'class_type': r.class_type,
                     'phone': r.phone, 'tel': r.tel, 'address': r.address, 'zipcode': r.zipcode, 'email': r.email,
                     'qq': r.qq, 'wechat': r.wechat, 'remark': r.remark, 'recorder': r.recorder,
                     'create_at': datetime.datetime.strftime(r.create_at, '%Y-%m-%d %H:%M'),
                     'last_upd_at': datetime.datetime.strftime(r.last_upd_at, '%Y-%m-%d %H:%M'),
                     'last_user': r.last_user
                     })
        i += 1
    return jsonify({"total": total, "rows": rows, 'errorCode': 0, 'msg': 'ok'})


@app.route('/dance_teacher_details_get', methods=['POST'])
@login_required
def dance_teacher_details_get():
    """
    查询 员工与老师 列表
        查询条件：rows          每页显示的条数
                  page          页码，第几页，从1开始
                                特殊值 -2，表示根据 teacher_id 查询，并求出该 单据 的序号
                  teacher_id    员工与老师数据 id, optional, 当 page==-2,必填
                  school_id     分校ID
                  in_job        是否在职
                  name          教职工姓名过滤条件

    :return:    符合条件的 教职工 列表
    {
        total:          记录数
        row: {
            id:
            name:       员工与老师姓名
        }
        edu: {}         教育经历
        work: {}        工作经历
        errorCode:      错误码
        msg:            错误信息
            ----------------    ----------------------------------------------
            errorCode           msg
            ----------------    ----------------------------------------------
            0                   'ok'
            600                 '您没有管理分校的权限！'
    }
    """
    page_size = int(request.form['rows'])
    page_no = int(request.form['page'])

    school_ids = DanceUserSchool.get_school_ids_by_uid()
    dcq = DanceTeacher.query.filter_by(company_id=g.user.company_id)
    if 'school_id' not in request.form or request.form['school_id'] == 'all':
        school_id_intersection = school_ids
    else:
        school_id_intersection = list(set(school_ids).intersection(set(map(int, request.form['school_id']))))
    if len(school_id_intersection) == 0:
        return jsonify({'errorCode': 600, 'msg': u'您没有管理分校的权限！'})
    dcq = dcq.filter(DanceTeacher.school_id.in_(school_id_intersection))

    if 'in_job' in request.form:
        dcq = dcq.filter_by(in_job=request.form['in_job'])

    if 'name' in request.form and request.form['name'] != '':
        dcq = dcq.filter(DanceTeacher.name.like('%' + request.form['name'] + '%'))

    total = dcq.count()
    if page_no <= -2:
        # 根据 id 获取 教职工 详细信息，并求出其序号。
        if 'teacher_id' not in request.form:
            print u'输入参数错误，缺少字段 teacher_id'
            return jsonify({'errorCode': 401, 'msg': u'输入参数错误，缺少字段 teacher_id'})
        rid = int(request.form['teacher_id'])
        r = DanceTeacher.query.get(rid)
        if r is None:
            return jsonify({'errorCode': 400, 'msg': u'不存在id为[%s]的员工与老师信息！' % rid})
        rec_no = dcq.filter(DanceTeacher.id >= r.id).count()
    else:
        if page_no <= 0:  # 容错处理
            page_no = 1
        offset = (page_no - 1) * page_size
        r = dcq.order_by(DanceTeacher.id.desc()).limit(page_size).offset(offset).first()
        if r is None:
            return jsonify({'errorCode': 400, 'msg': u'不存在id为[%s]的员工与老师信息！' % request.form['teacher_id']})
        rec_no = offset + 1

    """ 查询 员工与老师 所在的分校名称和编号 """
    sc = DanceSchool.query.filter_by(id=r.school_id).first()

    leave_day = datetime.datetime.strftime(r.leave_day, '%Y-%m-%d') if r.leave_day is not None else None
    row = {"id": r.id, "teacher_no": r.teacher_no, "school_no": sc.school_no, 'no': rec_no,
           "school_name": sc.school_name, "name": r.name, "rem_code": r.rem_code, 'degree': r.degree,
           'birthday': r.birthday, 'join_day': datetime.datetime.strftime(r.join_day, '%Y-%m-%d'),
           'leave_day': leave_day, 'te_title': r.te_title,
           'gender': 1 if r.gender else 0, 'gender_text': u'男' if r.gender else u'女',
           'te_type': 1 if r.te_type else 0, 'te_type_text': teacher_type_s(r.te_type),
           'in_job': 1 if r.in_job else 0, 'in_job_text': u'是' if r.in_job else u'否',
           'is_assist': 1 if r.is_assist else 0, 'is_assist_text': u'是' if r.is_assist else u'否',
           'has_class': 1 if r.has_class else 0, 'has_class_text': u'是' if r.has_class else u'否',
           'nation': r.nation,
           'birth_place': r.birth_place, 'idcard': r.idcard, 'class_type': r.class_type,
           'phone': r.phone, 'tel': r.tel, 'address': r.address, 'zipcode': r.zipcode, 'email': r.email,
           'qq': r.qq, 'wechat': r.wechat, 'remark': r.remark, 'recorder': r.recorder,
           'create_at': datetime.datetime.strftime(r.create_at, '%Y-%m-%d %H:%M'),
           'last_upd_at': datetime.datetime.strftime(r.last_upd_at, '%Y-%m-%d %H:%M'),
           'last_user': r.last_user
           }

    """ 查询 教育经历"""
    eds = DanceTeacherEdu.query.filter_by(teacher_id=r.id).all()
    edu = []
    for ed in eds:
        edu.append({'id': ed.id, 'teacher_id': ed.teacher_id, 'begin_day': ed.begin_day, 'end_day': ed.end_day,
                    'school': ed.school, 'major': ed.major, 'remark': ed.remark})

    """ 查询 工作经历"""
    works = DanceTeacherWork.query.filter_by(teacher_id=r.id).all()
    work = []
    for wk in works:
        work.append({'id': wk.id, 'teacher_id': wk.teacher_id, 'begin_day': ed.begin_day, 'end_day': ed.end_day,
                     'firm': wk.firm, 'position': wk.position, 'content': wk.content, 'remark': wk.remark})
    return jsonify({"total": total, "row": row, 'edu': edu, 'work': work, 'errorCode': 0, 'msg': 'ok'})


@app.route('/dance_teacher_query', methods=['POST'])
@login_required
def dance_teacher_query():
    """
    根据姓名或者 姓名拼音 查询 符合条件的 员工与老师信息
    输入参数：
    {
        name:           老师姓名，   可选参数
        school_id:      分校id，   可选参数
        in_job:         是否在职，   可选参数
    }
    :return:
    {   value:          老师姓名
        text:           老师姓名
    }
    """
    school_ids = DanceUserSchool.get_school_ids_by_uid()
    if len(school_ids) == 0:
        return jsonify({'errorCode': 0, 'msg': 'no data'})

    name = request.form['name']
    if name.encode('UTF-8').isalpha():
        dcq = DanceTeacher.query.filter(DanceTeacher.rem_code.like('%' + name + '%'))
    else:
        dcq = DanceTeacher.query.filter(DanceTeacher.name.like('%' + name + '%'))

    if 'school_id' not in request.form or request.form['school_id'] == 'all':
        dcq = dcq.filter(DanceTeacher.school_id.in_(school_ids))
    else:
        dcq = dcq.filter(DanceTeacher.school_id.in_(request.form['school_id']))

    if 'in_job' in request.form:
        dcq = dcq.filter_by(in_job=request.form['in_job'])

    ret = []
    records = dcq.order_by(DanceTeacher.id.desc()).all()
    for rec in records:
        ret.append({'value': rec.name, 'text': rec.name})

    return jsonify(ret)


@app.route('/dc_comm_fee_mode_update', methods=['POST'])
@login_required
def dc_comm_fee_mode_update():
    """
    更新 收费方式。 包括新增 和 修改
    输入参数
        data:[{         输入参数
                id:             收费方式id, 大于0 - 修改， 0 - 新增
                row:{           收费方式记录
                    fee_mode:   收费方式名称
                    disc_rate   费率
                    }
            }]
    :return:
        errorCode:      错误码
            0       成功
            600     Parameter error. [data] required.
            801     名称为[%s]的收费方式已经存在！
            802     费率应在0~100之间!
            803     请输入费率!
        msg:            错误信息
    """
    if 'data' not in request.form:
        return jsonify({'errorCode': 600, 'msg': 'Parameter error. [data] required.'})
    json_str = request.form['data']
    obj = json.loads(json_str)
    for fee in obj:
        row = fee['row']
        if 'disc_rate' in row:
            rate = row['disc_rate']
            if not is_float(rate):
                return jsonify({'errorCode': 802, 'msg': u'费率应在0~100之间!'})
            rate = -1 if rate == '' else float(rate)
            if rate < 0 or rate > 100:
                return jsonify({'errorCode': 802, 'msg': u'费率应在0~100之间!'})
        if 'id' not in fee or fee['id'] <= 0:
            if 'disc_rate' not in row:
                return jsonify({'errorCode': 803, 'msg': u'请输入费率!'})
            fee_mode = row['fee_mode']
            # 收费名称不能重复，查询是否有重复记录
            dup = DcCommFeeMode.query.filter_by(company_id=g.user.company_id).filter_by(fee_mode=fee_mode).first()
            if dup is not None:
                return jsonify({'errorCode': 801, 'msg': u'名称为[%s]的收费方式已经存在！' % fee_mode})
            nr = DcCommFeeMode(fee_mode, row['disc_rate'])
            db.session.add(nr)
        else:
            nr = DcCommFeeMode.query.get(fee['id'])
            if nr is not None:
                nr.update(row)
                db.session.add(nr)

    db.session.commit()
    return jsonify({'errorCode': 0, 'msg': u'更新成功！'})


@app.route('/dc_comm_fee_mode_query', methods=['POST'])
@login_required
def dc_comm_fee_mode_query():
    name = request.form['condition']
    ret = []
    records = DcCommFeeMode.query.filter_by(company_id=g.user.company_id)\
        .order_by(DcCommFeeMode.id.asc()).filter(DcCommFeeMode.fee_mode.like('%'+name + '%'))
    for rec in records:
        ret.append({'value': rec.fee_mode, 'text': rec.fee_mode})
    return jsonify(ret)


@app.route('/dc_comm_fee_mode_get', methods=['POST'])
@login_required
def dc_comm_fee_mode_get():
    """
    查询收费方式
    :return:
        rows:       符合条件的记录
        total:      符合条件的记录总条数
        errorCode   错误码
            0       成功
        msg         错误信息
            'ok'    成功
    """
    page_size = int(request.form['rows'])
    page_no = int(request.form['page'])
    if page_no <= 0:  # 补丁
        page_no = 1

    dcq = DcCommFeeMode.query.filter_by(company_id=g.user.company_id)

    if 'condition' in request.form:
        cond = '%' + request.form['condition'] + '%'
        dcq = dcq.filter(DcCommFeeMode.fee_mode.like(cond))

    total = dcq.count()
    offset = (page_no - 1) * page_size
    records = dcq.order_by(DcCommFeeMode.id.desc()).limit(page_size).offset(offset).all()

    rows = []
    for rec in records:
        rows.append({'id': rec.id, 'fee_mode': rec.fee_mode, 'disc_rate': rec.disc_rate,
                     'recorder': rec.recorder, 'last_user': rec.last_user,
                     'create_at': datetime.datetime.strftime(rec.create_at, '%Y-%m-%d'),
                     'last_upd_at': datetime.datetime.strftime(rec.last_upd_at, '%Y-%m-%d %H:%M')})
    return jsonify({'rows': rows, 'total': total, 'errorCode': 0, 'msg': 'ok'})


@app.route('/dc_common_degree_get', methods=['POST'])
@login_required
def dc_common_degree_get():
    """
    查询 文化程度
    输入：{
        rows:       记录数
        page:       页码
        condition:  查询条件
    }
    :return:
        rows:       符合条件的记录
        total:      符合条件的记录总条数
        errorCode   错误码
            0       成功
        msg         错误信息
            'ok'    成功
    """
    page_size = int(request.form['rows'])
    page_no = int(request.form['page'])
    if page_no <= 0:  # 补丁
        page_no = 1

    dcq = DcCommon.query.filter_by(company_id=g.user.company_id, type=COMM_TYPE_DEGREE)

    if 'condition' in request.form:
        cond = '%' + request.form['condition'] + '%'
        dcq = dcq.filter(DcCommon.name.like(cond))

    total = dcq.count()
    offset = (page_no - 1) * page_size
    records = dcq.order_by(DcCommon.id).limit(page_size).offset(offset).all()

    rows = []
    for rec in records:
        rows.append({'id': rec.id, 'name': rec.name, 'scope': rec.scope, 'scope_text': degree_scope_s(rec.scope),
                     'recorder': rec.recorder, 'last_user': rec.last_user,
                     'create_at': datetime.datetime.strftime(rec.create_at, '%Y-%m-%d'),
                     'last_upd_at': datetime.datetime.strftime(rec.last_upd_at, '%Y-%m-%d %H:%M')})
    return jsonify({'rows': rows, 'total': total, 'errorCode': 0, 'msg': 'ok'})


@app.route('/dc_common_degree_query', methods=['POST'])
@login_required
def dc_common_degree_query():
    name = request.form['condition']
    ret = []
    records = DcCommon.query.filter_by(company_id=g.user.company_id, type=COMM_TYPE_DEGREE)\
        .order_by(DcCommon.id.asc()).filter(DcCommon.name.like('%'+name + '%'))
    for rec in records:
        ret.append({'value': rec.name, 'text': rec.name})
    return jsonify(ret)


@app.route('/dc_common_degree_update', methods=['POST'])
@login_required
def dc_common_degree_update():
    """
    更新 文化程度。 包括新增 和 修改
    输入参数
        data:[{         输入参数
                id:             记录id, 大于0 - 修改， 0 - 新增
                row:{
                    name:       名称
                    scope       收费方式范围
                    }
            }]
    :return:
        errorCode:      错误码
            0       成功
            600     Parameter error. [data] required.
            901     名称为[%s]的记录已经存在！
            903     请输入适用范围!
            904     请输入名称!
        msg:            错误信息
    """
    if 'data' not in request.form:
        return jsonify({'errorCode': 600, 'msg': 'Parameter error. [data] required.'})
    json_str = request.form['data']
    obj = json.loads(json_str)
    for info in obj:
        row = info['row']
        if 'id' not in info or info['id'] <= 0:
            if 'scope' not in row:
                return jsonify({'errorCode': 903, 'msg': u'请输入适用范围!'})
            if 'name' not in row:
                return jsonify({'errorCode': 904, 'msg': u'请输入名称!'})
            # 查询是否有重复记录
            dup = DcCommon.query.filter_by(company_id=g.user.company_id, type=COMM_TYPE_DEGREE)\
                .filter_by(name=row['name']).first()
            if dup is not None:
                return jsonify({'errorCode': 901, 'msg': u'名称为[%s]的记录已经存在！' % row['name']})
            row['type'] = COMM_TYPE_DEGREE
            nr = DcCommon(row)
            db.session.add(nr)
        else:
            # 查询是否有重复记录
            if 'name' in row:
                dup = DcCommon.query.filter_by(company_id=g.user.company_id, type=COMM_TYPE_DEGREE) \
                    .filter_by(name=row['name']).filter(DcCommon.id != info['id']).first()
                if dup is not None:
                    return jsonify({'errorCode': 801, 'msg': u'名称为[%s]的记录已经存在！' % row['name']})
            nr = DcCommon.query.get(info['id'])
            if nr is not None:
                nr.update(row)
                db.session.add(nr)

    db.session.commit()
    return jsonify({'errorCode': 0, 'msg': u'更新成功！'})


@app.route('/dc_common_job_title_get', methods=['POST'])
@login_required
def dc_common_job_title_get():
    """查询职位信息"""
    return dc_common_get(COMM_TYPE_JOB_TITLE, request.form)


@app.route('/dc_common_job_title_query', methods=['POST'])
@login_required
def dc_common_job_title_query():
    """条件查询职位信息"""
    return dc_common_query(COMM_TYPE_JOB_TITLE, request.form)


@app.route('/dc_common_job_title_update', methods=['POST'])
@login_required
def dc_common_job_title_update():
    """更新、新增职位信息"""
    return dc_common_update(COMM_TYPE_JOB_TITLE, request.form)


def dc_common_get(ty, obj):
    """
    查询 职位
    输入：
    ty:     类型
    obj = {
        rows:       记录数
        page:       页码
        condition:  查询条件
    }
    :return:
        rows:       符合条件的记录
        total:      符合条件的记录总条数
        errorCode   错误码
            0       成功
        msg         错误信息
            'ok'    成功
    """
    page_size = int(obj['rows'])
    page_no = int(obj['page'])
    if page_no <= 0:  # 补丁
        page_no = 1

    dcq = DcCommon.query.filter_by(company_id=g.user.company_id, type=ty)

    if 'condition' in obj:
        cond = '%' + obj['condition'] + '%'
        dcq = dcq.filter(DcCommon.name.like(cond))

    total = dcq.count()
    offset = (page_no - 1) * page_size
    records = dcq.order_by(DcCommon.id).limit(page_size).offset(offset).all()

    rows = []
    for rec in records:
        rows.append({'id': rec.id, 'name': rec.name,
                     'recorder': rec.recorder, 'last_user': rec.last_user,
                     'create_at': datetime.datetime.strftime(rec.create_at, '%Y-%m-%d'),
                     'last_upd_at': datetime.datetime.strftime(rec.last_upd_at, '%Y-%m-%d %H:%M')})
    return jsonify({'rows': rows, 'total': total, 'errorCode': 0, 'msg': 'ok'})


def dc_common_query(ty, obj):
    name = obj['condition']
    ret = []
    records = DcCommon.query.filter_by(company_id=g.user.company_id, type=ty)\
        .order_by(DcCommon.id.asc()).filter(DcCommon.name.like('%'+name + '%'))
    for rec in records:
        ret.append({'value': rec.name, 'text': rec.name})
    return jsonify(ret)


def dc_common_update(ty, obj_in):
    """
    更新 文化程度。 包括新增 和 修改
    输入参数
        ty:         类型
        obj_in = {
            data:[{         输入参数
                id:             记录id, 大于0 - 修改， 0 - 新增
                row:{
                    name:       名称
                    scope       收费方式范围
                    }
            }]
        }
    :return:
        errorCode:      错误码
            0       成功
            600     Parameter error. [data] required.
            901     名称为[%s]的记录已经存在！
            904     请输入名称!
        msg:            错误信息
    """
    if 'data' not in obj_in:
        return jsonify({'errorCode': 600, 'msg': 'Parameter error. [data] required.'})
    json_str = obj_in['data']
    obj = json.loads(json_str)
    for info in obj:
        row = info['row']
        if 'id' not in info or info['id'] <= 0:
            if 'name' not in row:
                return jsonify({'errorCode': 904, 'msg': u'请输入名称!'})
            # 查询是否有重复记录
            dup = DcCommon.query.filter_by(company_id=g.user.company_id, type=ty).filter_by(name=row['name']).first()
            if dup is not None:
                return jsonify({'errorCode': 901, 'msg': u'名称为[%s]的记录已经存在！' % row['name']})
            row['type'] = ty
            nr = DcCommon(row)
            db.session.add(nr)
        else:
            # 查询是否有重复记录
            if 'name' in row:
                dup = DcCommon.query.filter_by(company_id=g.user.company_id, type=ty) \
                    .filter_by(name=row['name']).filter(DcCommon.id != info['id']).first()
                if dup is not None:
                    return jsonify({'errorCode': 801, 'msg': u'名称为[%s]的记录已经存在！' % row['name']})
            nr = DcCommon.query.get(info['id'])
            if nr is not None:
                nr.update(row)
                db.session.add(nr)

    db.session.commit()
    return jsonify({'errorCode': 0, 'msg': u'更新成功！'})


@app.route('/dc_class_type_get', methods=['POST'])
@login_required
def dc_class_type_get():
    """
    查询班级类型
    输入参数：
    {
        condition:      查询条件
    }
    :return:
    {
        total:              记录总条数
        rows: [{
            id:
            name:           班级类型名称
            create_at:      创建时间
            last_upd_at:    最后更新时间
            last_user:      最后更新人
            recorder:       记录员
            no:             记录顺序号
        }]
        errorCode:      错误码
        msg:            错误信息
            ----------------    ----------------------------------------------
            errorCode           msg
            ----------------    ----------------------------------------------
            0                   'ok'
    }
    """
    page_size = int(request.form['rows'])
    page_no = int(request.form['page'])
    if page_no <= 0:  # 补丁
        page_no = 1

    dcq = DcClassType.query.filter_by(company_id=g.user.company_id)
    if 'condition' in request.form and request.form['condition'] != '':
        dcq = dcq.filter(DcClassType.name.like('%' + request.form['condition'] + '%'))

    total = dcq.count()
    offset = (page_no - 1) * page_size
    records = dcq.order_by(DcClassType.id).limit(page_size).offset(offset)
    i = offset + 1
    rows = []
    for rec in records:
        rows.append({'no': i, 'id': rec.id, "name": rec.name, 'recorder': rec.recorder,
                     'create_at': datetime.datetime.strftime(rec.create_at, '%Y-%m-%d %H:%M:%S'),
                     'last_upd_at': datetime.datetime.strftime(rec.create_at, '%Y-%m-%d %H:%M:%S'),
                     'last_user': rec.last_user
                     })
        i += 1
    return jsonify({"total": total, "rows": rows, 'errorCode': 0, 'msg': 'ok'})


@app.route('/dc_class_type_update', methods=['POST'])
@login_required
def dc_class_type_update():
    """
    更新 班级类型。 包括新增 和 修改
    输入参数
        data:[{         输入参数
                id:             班级类型id, 大于0 - 修改， 0 - 新增
                row:{           记录
                    name:       班级类型名称
                    }
            }]
    :return:
        errorCode:      错误码
            0       成功
            801     名称为[%s]的班级类型已经存在！
        msg:            错误信息
    """
    obj = request.json if request.json is not None else json.loads(request.form['data'])
    for rr in obj:
        row = rr['row']
        if 'id' not in rr or rr['id'] <= 0:
            # 收费名称不能重复，查询是否有重复记录
            dup = DcClassType.query.filter_by(company_id=g.user.company_id).filter_by(name=row['name']).first()
            if dup is not None:
                return jsonify({'errorCode': 801, 'msg': u'名称为[%s]的班级类型已经存在！' % row['name']})
            nr = DcClassType(row)
            db.session.add(nr)
        else:
            nr = DcClassType.query.get(rr['id'])
            if nr is not None:
                nr.update(row)
                db.session.add(nr)

    db.session.commit()
    return jsonify({'errorCode': 0, 'msg': u'更新成功！'})


@app.route('/dc_class_type_query', methods=['POST'])
@login_required
def dc_class_type_query():
    """
    条件查询 班级类型
    输入参数：
    {
        condition:          查询条件
    }
    :return:
    [{
        value:          班级类型
        text:           班级类型
    }]
    """
    name = request.form['condition']

    ret = []
    records = DcClassType.query.filter_by(company_id=g.user.company_id)\
        .order_by(DcClassType.id).filter(DcClassType.name.like('%'+name + '%'))
    for rec in records:
        ret.append({'value': rec.name, 'text': rec.name})

    return jsonify(ret)


@app.route('/dance_progressbar', methods=['POST'])
@login_required
def dance_progressbar():
    key = str(g.user.id)
    value = tools.excel.progressbar[key]['value'] if key in tools.excel.progressbar else 0
    sheet = tools.excel.progressbar[key]['sheet'] if key in tools.excel.progressbar else ''
    return jsonify({'value': value, 'sheet': sheet})


@app.route('/api/dance_tm_get', methods=['POST'])
@login_required
def api_dance_tm_get():
    """
    查询教材信息
    :return:
        rows        查询到的记录
            tm_no       教材编号
            tm_name     教材名称
            tm_unit     单位
            tm_price_sell  售价
        total       记录条数
        errorCode   错误码
            0       成功
        msg         错误新
            'ok'    成功
    """
    records = DcTeachingMaterial.query.filter_by(company_id=g.user.company_id).all()
    tm = []
    for rec in records:
        tm.append({'id': rec.id, 'tm_no': rec.material_no, 'tm_name': rec.material_name,
                   'tm_unit': rec.unit, 'tm_price_sell': rec.price_sell})

    return jsonify({'rows': tm, 'total': len(tm), 'errorCode': 0, 'msg': 'ok'})


@app.route('/api/dance_fee_item_get', methods=['POST'])
@login_required
def api_dance_fee_item_get():
    """
    查询收费项目
        输入        无
    :return:
        rows:       记录      -- for combogrid  返回值必须带 total 和 rows
            combobox 则不需要 total 和 rows
        {'rows': fee_item, 'total': len(fee_item), 'errorCode': 0, 'msg': 'ok'}
            fee_id      收费项目id
            fee_item    收费项目
        total:      记录条数    -- for combogrid
        errorCode:  错误码，0 成功， 其他失败
        msg:        错误信息，'ok' 成功
    """

    if 'ctrl' not in request.form or request.form['ctrl'] == 'combobox':
        ctrl = 'combobox'
    else:
        ctrl = 'combogrid'

    dcq = DcFeeItem.query.filter_by(company_id=g.user.company_id)
    ty = 1
    if 'type' in request.form:
        ty = request.form['type']
    dcq = dcq.filter_by(type=ty)

    records = dcq.all()
    fee_item = []
    for rec in records:
        fee_item.append({'fee_id': rec.id, 'fee_item': rec.fee_item})

    if ctrl == 'combogrid':
        return jsonify({'rows': fee_item, 'total': len(fee_item), 'errorCode': 0, 'msg': 'ok'})
    else:
        return jsonify(fee_item)


@app.route('/api/dance_student_query', methods=['POST'])
@login_required
def api_dance_student_query():
    """
    根据 姓名 模糊查询 所有匹配条件的 姓名列表，供操作员选择。
        查询条件：
            school_id       分校id，可选。 默认根据用户可以管理的分校查询
            is_training     是否在读 是/否 （在本培训中心），可选。 默认所有学员
            name            学员姓名或者姓名拼音首字母。必填。
    :return:
            id          学员id
            name        学员姓名
            code        学号
    """
    dcq = DanceStudent.query
    name = request.form['name']
    if name.encode('UTF-8').isalpha():
        dcq = dcq.filter(DanceStudent.rem_code.like('%' + name + '%'))
    else:
        dcq = dcq.filter(DanceStudent.name.like('%' + name + '%'))

    school_ids = DanceUserSchool.get_school_ids_by_uid()
    if 'school_id' not in request.form or request.form['school_id'] == 'all':
        school_id_intersection = school_ids
    else:
        school_id_intersection = list(set(school_ids).intersection(set(map(int, request.form['school_id']))))
    if len(school_id_intersection) == 0:
        return jsonify({'errorCode': 600, 'msg': u'您没有管理分校的权限！'})
    dcq = dcq.filter(DanceStudent.school_id.in_(school_id_intersection))

    if 'is_training' in request.form:
        dcq = dcq.filter_by(is_training=request.form['is_training'])

    ret = []
    records = dcq.order_by(DanceStudent.id.desc()).all()
    for rec in records:
        ret.append({'id': rec.id, 'name': rec.name, 'code': rec.sno})

    return jsonify(ret)


@app.route('/api/dance_class_by_student', methods=['POST'])
@login_required
def api_dance_class_by_student():
    """
    查询学员的报班信息
        查询条件：
            student_no      学员编号
    :return:
            errorCode,
            msg,
            cls         班级列表
                class_id    班级id
                class_no    班级编号
                class_name  班级名称
                cost_mode   收费模式
                cost        收费标准
    """
    if 'student_no' not in request.form:
        return jsonify({'errorCode': 601, 'msg': u'Params error, [student_no] required.'})
    student_no = request.form['student_no']
    records = DanceStudentClass.query.filter_by(student_id=student_no).filter_by(company_id=g.user.company_id)\
        .join(DanceClass, DanceStudentClass.class_id == DanceClass.cno).filter(DanceStudentClass.status == u'正常')\
        .add_columns(DanceClass.id, DanceClass.cno, DanceClass.class_name, DanceClass.cost_mode, DanceClass.cost).all()
    cls = []
    for rec in records:
        cls.append({'class_id': rec[1], 'class_no': rec[2], 'class_name': rec[3],
                    'cost_mode': rec[4], 'cost': rec[5]})

    return jsonify({'errorCode': 0, 'msg': 'ok', 'cls': cls})


@app.route('/api/dance_show_name_get', methods=['POST'])
@login_required
def api_dance_show_name_get():
    """
    查询演出名称
    :return: [{
        show_name: str  演出名称
        show_id: int    演出 id
        show_no: str    演出编号
        }]
    """
    """ 
    records = DcShow.query.filter_by(company_id=g.user.company_id)\
        .join(DcShowFeeCfg, DcShowFeeCfg.show_id == DcShow.id)\
        .join(DcFeeItem, DcFeeItem.id == DcShowFeeCfg.fee_item_id)\
        .add_columns(DcFeeItem.fee_item, DcShowFeeCfg.cost).order_by(DcShow.id.desc()).all()
    """
    records = DcShow.query.filter_by(company_id=g.user.company_id).order_by(DcShow.id.desc()).all()
    show = []
    for rec in records:
        show.append({'show_name': rec.show_name, 'show_id': rec.id, 'show_no': rec.show_no})
    return jsonify(show)


@app.route('/api/dance_show_with_cfg_get', methods=['POST'])
@login_required
def api_dance_show_with_cfg_get():
    """
    查询演出名称
    :return: {
        errorCode   错误码
            0       正确
            701     参数错误，缺少 id 字段
            702     记录[id=%d]不存在！
        msg     错误信息
        show_name: str  演出名称
        show_id: int    演出 id
        show_no: str    演出编号
        cfg[{       演出收费配置列表
            fee_item    收费项目
            cost        费用
            }]
        }
    """
    dcq = DcShow.query.filter_by(company_id=g.user.company_id)

    if 'id' in request.form:
        show_id = request.form['id']
        dcq = dcq.filter_by(id=show_id)
    else:
        return jsonify({'errorCode': 701, 'msg': 'Parameter error, [id] required!'})
    r = dcq.join(DcShowFeeCfg, DcShowFeeCfg.show_id == DcShow.id).order_by(DcShow.id.desc()).first()
    if r is None:
        return jsonify({'errorCode': 702, 'msg': u'记录[id=%d]不存在！' % show_id})

    cfg = DcShowFeeCfg.query.filter_by(show_id=show_id)\
        .join(DcFeeItem, DcFeeItem.id == DcShowFeeCfg.fee_item_id)\
        .add_column(DcFeeItem.fee_item)\
        .order_by(DcShowFeeCfg.id.desc()).all()
    cfg_list = []
    for rec in cfg:
        cfg_list.append({'cost': rec[0].cost, 'fee_item': rec[1]})

    return jsonify({'show_name': r.show_name, 'show_id': r.id, 'show_no': r.show_no, 'cfg': cfg_list,
                    'errorCode': 0, 'msg': 'ok'})


@app.route('/api/dance_shows_cfg_get', methods=['POST'])
@login_required
def api_dance_shows_cfg_get():
    """
    查询演出名称
    :return: {
        errorCode   错误码
            0       正确
            701     参数错误，缺少 id 字段
            702     记录[id=%d]不存在！
        msg     错误信息
        shows[{
            show_name: str  演出名称
            show_id: int    演出 id
            show_no: str    演出编号
            cfg[{       演出收费配置列表
                fee_item    收费项目
                fee_item_id 收费项目id
                cost        费用
                }]
            }]
        }
    """
    dcq = DcShow.query.filter_by(company_id=g.user.company_id)
    records = dcq.join(DcShowFeeCfg, DcShowFeeCfg.show_id == DcShow.id).order_by(DcShow.id.desc()).all()
    shows = []
    for r in records:
        cfg = DcShowFeeCfg.query.filter_by(show_id=r.id)\
            .join(DcFeeItem, DcFeeItem.id == DcShowFeeCfg.fee_item_id)\
            .add_column(DcFeeItem.fee_item)\
            .order_by(DcShowFeeCfg.id.desc()).all()
        cfg_list = []
        for rec in cfg:
            cfg_list.append({'cost': rec[0].cost, 'fee_item': rec[1], 'fee_item_id': rec[0].fee_item_id})
        shows.append({'show_name': r.show_name, 'show_id': r.id, 'show_no': r.show_no, 'cfg': cfg_list})

    return jsonify({'shows': shows, 'errorCode': 0, 'msg': 'ok'})


@app.route('/api/dance_fee_mode_get', methods=['POST'])
@login_required
def api_dance_fee_mode_get():
    """
    查询收费模式
    :return:
        fee_mode_id     收费模式id
        fee_mode        收费模式名称
        disc_rate       损失点数
    """
    records = DcCommFeeMode.query.filter_by(company_id=g.user.company_id).all()
    fee_mode = []
    for rec in records:
        fee_mode.append({'fee_mode_id': rec.id, 'fee_mode': rec.fee_mode, 'disc_rate': rec.disc_rate})
    return jsonify(fee_mode)


@app.route('/api/dance_school_get', methods=['POST'])
@login_required
def api_dance_school_get():
    """
    查询分校
    :return:
    [{
            school_id:      分校id
            school_no:      分校编号
            school_name:    分校名称
    }]
    """
    return jsonify(DanceSchool.dc_school('all'))


@app.route('/api/dance_class_type_get', methods=['POST'])
@login_required
def api_dance_class_type_get():
    """
    查询分校
    :return:
    [{
            ct_id:          班级类型id
            ct_name:        班级类型名称
    }]
    """
    return jsonify(DcClassType.dc_class_type())
