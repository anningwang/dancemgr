# -*- coding:utf-8 -*-
import xlrd
import xlwt
from app import db
from app.models import DanceStudent, DanceClass, DanceStudentClass, DanceSchool, DanceReceipt, DanceUserSchool,\
    DcFeeItem, DanceOtherFee, DanceClassReceipt, DcTeachingMaterial, DanceTeaching, DcClassType, DanceTeacher,\
    DanceTeacherEdu, DanceTeacherWork, DcCommon
from flask import g
from dcglobal import *

progressbar = {}         # 进度条的值  用户id(key) = {value: 60, sheet: u'收费单'}

DANCE_PRECISION = 1e-5


def char2int(s):
    """
    将Excel文件中的列序号（A,B,C,...,Z,AA,AB,...）转换为 列数字(1,2,3,..26,27,28,...)
    :param s:       col char:       A , AA or AB
    :return:        col number:     1, 27 or 28
    """
    def fn(x, y):
        return x * 26 + y

    def char2num(c):
        return ord(c.upper())-64
    return reduce(fn, map(char2num, s))


def excel_col2int(cols):
    """
    将Excel文件中的列序号[A,B,C,...,Z,AA,AB,...] 转换为 列数字 [1,2,3,..,26,27,28,...]
    :param cols:    list, eg. ['A','B','C',...,'Z','AA','AB',...]
    :return:        list, eg. [1,2,3,..,26,27,28,...]
    """
    return map(char2int, cols)


def check_excel_col_name(cols):
    """
    检查Excel文件列序号名称是否有错误
    :param cols:        列序号列表，例如：['A','B','C',...,'Z','AA','AB',...]
    :return:            1. True for correct, False for error
                         2. error message if error
    """
    for col in cols:
        if len(col) == 0:
            return False, 'has empty col'
        for c in col:
            c = ord(c.upper())
            # A ascii 65, ord Z is 122    if c < ord('A') or c > ord('Z'):
            if c < 65 or c > 122:
                return False, 'has invalid char'
    return True, 'ok'


def import_student(fn, is_asc=False):
    """
    :param fn:   文件名，需要导入数据的Excel文件名
    :param is_asc      是否 顺序导入。True 顺序导入， False 逆序导入
    :return:     读取的 Excel 数据,
                  信息: 'ok' -- 正确，其他错误,
                  正确存入条数,
                  错误条数
    """
    sheet_pages = [u'报名登记', u'报班——选择班级']
    global progressbar
    progressbar[str(g.user.id)] = {'value': 1, 'sheet': sheet_pages[0]}

    columns = ['sno', 'school_id', 'consult_no', 'name', 'rem_code',
               'gender', 'degree', 'birthday', 'register_day', 'information_source',
               'counselor', 'reading_school', 'grade', 'phone', 'tel',
               'address', 'zipcode', 'email', 'qq', 'wechat',
               'mother_name', 'mother_phone', 'mother_tel', 'mother_company', 'card',
               'father_name', 'father_phone', 'father_tel', 'father_company', 'points',
               'is_training', 'remark', 'recorder', 'idcard', 'mother_wechat',
               'father_wechat']
    cols_cn = [u'学号', u'分校名称', u'咨询编号', u'姓名', u'助记码',
               u'性别', u'文化程度', u'出生日期', u'登记日期', u'信息来源',
               u'咨询师', u'所在学校', u'年级', u'本人手机', u'固定电话',
               u'联系地址', u'邮政编码', u'Email', u'QQ', u'微信标识',
               u'母亲姓名', u'母亲手机', u'母亲固话', u'母亲工作单位', u'卡号',
               u'父亲姓名', u'父亲手机', u'父亲固话', u'父亲工作单位', u'赠送积分',
               u'是否在读', u'备注', u'录入员', u'身份证', u'母亲微信标识',
               u'父亲微信标识'
               ]
    cols_need = [u'学号', u'分校名称', u'姓名', u'登记日期', u'是否在读']

    workbook = xlrd.open_workbook(fn)
    worksheets = workbook.sheet_names()
    for page in sheet_pages:
        if page not in worksheets:
            return {'errorCode': 880, 'msg': u'未找到页面[%s]' % page}

    sh = workbook.sheet_by_name(sheet_pages[0])
    cnt = sh.nrows
    if cnt <= 1:
        return {'errorCode': 2000, 'msg': u'无有效数据！'}

    ck = dc_check_col(sh.row_values(0), cols_cn, cols_need)
    if ck['errorCode'] != 0:
        return ck
    cols_num = list(ck['excel_idx'])
    col_idx = list(ck['col_idx'])

    num_right = 0
    num_wrong = 0
    school_ids = DanceSchool.name_to_id()

    # 逆序或顺序遍历。第一行为表头需要过滤掉
    for row in (range(1, cnt) if is_asc else range(cnt - 1, 0, -1)):
        r = sh.row_values(row)
        if r[0] == u'合计':
            continue

        parm = {}
        for i in range(len(cols_num)):
            parm[columns[col_idx[i]]] = r[cols_num[i]]

        # 特殊列的处理
        parm['school_id'] = school_ids[parm['school_id'].lower()]

        # 保证 学员 不能重复 分校id+学号 唯一
        has = DanceStudent.query.filter_by(school_id=parm['school_id']).filter_by(sno=parm['sno']).first()
        if has is None:
            record = DanceStudent(parm)
            db.session.add(record)
            num_right += 1
        else:
            num_wrong += 1  # 重复数据
        # -----------------------------------------------------------------

        value = int((num_wrong + num_right) * 100.0 / (cnt - 1))
        progressbar[str(g.user.id)]['value'] = value + 1 if value == 0 else value

    progressbar[str(g.user.id)]['value'] = 100
    msg = '[' + sh.name + u']页 '
    msg += '' if num_right == 0 else (u"导入 %d 条！" % num_right)
    msg += '' if num_wrong == 0 else (u'忽略重复 %d 条。' % num_wrong)

    # 导入 [报班——选择班级] 页面 --------------------------------------------------------
    ret = dc_import_student_class(workbook.sheet_by_name(sheet_pages[1]))
    msg += ret['msg']
    if ret['errorCode'] != 0:
        return ret

    db.session.commit()
    return {'errorCode': 0, 'msg': msg}


def import_class(fn, is_asc=False):
    """
    :param fn:   文件名，需要导入数据的Excel文件名
    :param is_asc      是否 顺序导入。True 顺序导入， False 逆序导入
    :return:     1. 读取的 Excel 数据,
                  2. 信息: 'ok' -- 正确，其他错误,
                  3. 正确存入条数,
                  4. 错误条数
    """
    sheet_pages = [u'班级信息']
    global progressbar
    progressbar[str(g.user.id)] = {'value': 1, 'sheet': sheet_pages[0]}

    columns = ['cno', 'school_id', 'class_name', 'rem_code',
               'begin_year', 'class_type', 'class_style', 'teacher', 'cost_mode',
               'cost', 'plan_students', 'cur_students', 'is_ended', 'remark',
               'recorder'
               ]
    cols_cn = [u'班级编号', u'分校名称', u'班级名称', u'助记码',
               u'开班年份', u'课程类别', u'授课形式', u'默认授课老师',u'学费收费模式',
               u'学费收费标准', u'计划招收人数', u'当前人数', u'是否结束', u'备注',
               u'录入员'
               ]
    cols_need = [u'班级编号', u'分校名称', u'班级名称', u'是否结束']
    workbook = xlrd.open_workbook(fn)
    worksheets = workbook.sheet_names()
    for page in sheet_pages:
        if page not in worksheets:
            return {'errorCode': 880, 'msg': u'未找到页面[%s]' % page}

    sh = workbook.sheet_by_name(sheet_pages[0])
    cnt = sh.nrows
    if cnt <= 1:
        return {'errorCode': 2000, 'msg': u'无有效数据！'}

    ck = dc_check_col(sh.row_values(0), cols_cn, cols_need)
    if ck['errorCode'] != 0:
        return ck
    cols_num = list(ck['excel_idx'])
    col_idx = list(ck['col_idx'])

    num_right = 0
    num_wrong = 0
    school_ids = DanceSchool.name_to_id()

    # 查询班级类型 与 id 的对应表
    class_type_id = DcClassType.name_id()

    # 逆序或顺序遍历。第一行为表头需要过滤掉
    for row in (range(1, cnt) if is_asc else range(cnt - 1, 0, -1)):
        r = sh.row_values(row)
        if r[0] == u'合计':
            continue

        parm = {}
        for i in range(len(cols_num)):
            parm[columns[col_idx[i]]] = r[cols_num[i]]

        # 特殊列的处理
        parm['is_ended'] = 1 if parm['is_ended'] == u'是' else 0
        parm['school_id'] = school_ids[parm['school_id'].lower()]
        if parm['class_type'] in class_type_id:
            parm['class_type'] = class_type_id[parm['class_type']]
        else:
            db.session.add(DcClassType({'name': parm['class_type']}))
            nr = DcClassType.query.filter_by(company_id=g.user.company_id, name=parm['class_type']).first()
            if nr is None:
                raise Exception('Add class type record error!')
            else:
                class_type_id[parm['class_type']] = nr.id
                parm['class_type'] = nr.id
        parm['class_style'] = class_style_val(parm['class_style'])
        parm['cost_mode'] = class_mode_val(parm['cost_mode'])

        # 保证班级不能重复
        has = DanceClass.query.filter_by(school_id=parm['school_id']).filter_by(cno=parm['cno']).first()
        if has is None:
            record = DanceClass(parm)
            db.session.add(record)
            num_right += 1
        else:
            num_wrong += 1  # 重复数据
        # -----------------------------------------------------------------

        value = int((num_wrong+num_right)*100.0/(cnt-1))
        progressbar[str(g.user.id)]['value'] = value + 1 if value == 0 else value

    progressbar[str(g.user.id)]['value'] = 100
    msg = u'[%s]页%s' % (sh.name, '' if num_right+num_wrong != 0 else u' 无数据！')
    msg += '' if num_right == 0 else (u' 导入 %d 条！' % num_right)
    msg += '' if num_wrong == 0 else (u' 忽略重复 %d 条。' % num_wrong)

    db.session.commit()
    return {'errorCode': 0, 'msg': msg}


def import_receipt(fn, is_asc=False):
    """
    :param fn:   文件名，需要导入数据的Excel文件名
    :param is_asc      是否 顺序导入。True 顺序导入， False 逆序导入
    :return:     errorCode     0 成功， 非0 错误
                  msg           信息: 'ok' -- 正确，其他错误,
    """
    sheet_pages = [u'收费单', u'班级——学费', u'教材费', u'其他费']
    global progressbar
    progressbar[str(g.user.id)] = {'value': 1, 'sheet': sheet_pages[0]}

    columns = ['receipt_no', 'school_id', 'student_id', 'deal_date', 'receivable_fee',
               'teaching_fee', 'other_fee', 'total', 'real_fee', 'arrearage',
               'counselor', 'remark', 'recorder', 'fee_mode']
    cols_cn = [u'收费单号', u'分校名称', u'学号', u'收费日期', u'应收学费',
               u'教材费', u'其他费', u'费用合计', u'实收费', u'学费欠费',
               u'咨询师', u'备注', u'录入员', u'收费方式']
    cols_need = [u'收费单号', u'分校名称', u'学号']
    workbook = xlrd.open_workbook(fn)
    worksheets = workbook.sheet_names()

    for page in sheet_pages:
        if page not in worksheets:
            return {'errorCode': 880, 'msg': u'未找到页面[%s]' % page}

    sh = workbook.sheet_by_name(sheet_pages[0])
    cnt = sh.nrows
    if cnt <= 1:
        return {'errorCode': 2000, 'msg': u"无有效数据！"}

    ck = dc_check_col(sh.row_values(0), cols_cn, cols_need)
    if ck['errorCode'] != 0:
        return ck
    cols_num = list(ck['excel_idx'])
    col_idx = list(ck['col_idx'])

    num_right = 0
    num_wrong = 0
    school_ids = DanceSchool.name_to_id()
    sid = list(school_ids.values())
    students = DanceStudent.get_records(sid)

    # 逆序或顺序遍历。第一行为表头需要过滤掉
    for row in (range(1, cnt) if is_asc else range(cnt - 1, 0, -1)):
        r = sh.row_values(row)
        if r[0] == u'合计':
            continue

        parm = {}
        for i in range(len(cols_num)):
            parm[columns[col_idx[i]]] = r[cols_num[i]]

        # 特殊列的处理
        # 分校名称 转为 分校ID
        parm['school_id'] = school_ids[parm['school_id'].lower()]

        # 学号 转 学员id
        parm['student_id'] = students[parm['student_id']].id

        # -----------------------------------------------------------------------------------------
        # 保证 收费单号+学生id+学校id 不能重复
        has = DanceReceipt.query.filter_by(school_id=parm['school_id'], receipt_no=parm['receipt_no'],
                                           student_id=parm['student_id']).first()
        if has is None:
            tb = DanceReceipt(parm)
            db.session.add(tb)
            num_right += 1
        else:
            num_wrong += 1  # 重复数据
        # -----------------------------------------------------------------------------------------

        value = int((num_wrong+num_right)*100.0/(cnt-1))
        progressbar[str(g.user.id)]['value'] = value + 1 if value == 0 else value

    progressbar[str(g.user.id)]['value'] = 100
    msg = u'[%s]页%s' % (sh.name, '' if num_right + num_wrong != 0 else u' 无数据！')
    msg += '' if num_right == 0 else (u"导入 %d 条！" % num_right)
    msg += '' if num_wrong == 0 else (u'忽略重复 %d 条。' % num_wrong)

    # 导入 [其他费] 页面 -------------------------------------------------------------
    receipt = DanceReceipt.get_records(sid)
    dcclass = DanceClass.get_records(sid)
    feeitem = DcFeeItem.get_records()
    ret = dc_import_other_fee(workbook.sheet_by_name(sheet_pages[3]), receipt, dcclass, feeitem)
    msg += ret['msg']
    if ret['errorCode'] != 0:
        return ret

    # 导入 [班级——学费] 页面 ----------------------------------------------------------
    ret = dc_import_class_fee(workbook.sheet_by_name(sheet_pages[1]), receipt, dcclass)
    msg += ret['msg']
    if ret['errorCode'] != 0:
        return ret

    material = DcTeachingMaterial.get_records()
    # 导入 [教材费] 页面 -------------------------------------------------------------
    ret = dc_import_teaching_fee(workbook.sheet_by_name(sheet_pages[2]), receipt, dcclass, material)
    msg += ret['msg']
    if ret['errorCode'] != 0:
        return ret

    db.session.commit()
    return {'errorCode': 0, 'msg': msg}


def import_teacher(fn, is_asc=False):
    """
    :param fn:   文件名，需要导入数据的Excel文件名
    :param is_asc      是否 顺序导入。True 顺序导入， False 逆序导入
    :return:     errorCode     0 成功， 非0 错误
                  msg           信息: 'ok' -- 正确，其他错误,
    """
    sheet_pages = [u'员工与老师信息', u'教育经历', u'工作经历']
    global progressbar
    progressbar[str(g.user.id)] = {'value': 1, 'sheet': sheet_pages[0]}

    columns = ['teacher_no', 'school_id', 'name', 'rem_code', 'degree',
               'birthday', 'join_day', 'leave_day', 'te_title', 'gender',
               'te_type', 'in_job', 'is_assist', 'has_class', 'nation',
               'birth_place', 'idcard', 'class_type', 'phone', 'tel',
               'address', 'zipcode', 'Email', 'QQ', 'wechat',
               'recorder', 'remark'
               ]
    cols_cn = [u'员工与老师编号', u'所属分校', u'姓名', u'助记码', u'文化程度',
               u'出生日期', u'入职日期', u'离职日期', u'职位', u'性别',
               u'类别', u'是否在职', u'是否是咨询师', u'是否授课', u'民族',
               u'籍贯', u'身份证号码', u'教授课程', u'手机', u'电话',
               u'联系地址', u'邮政编码', u'Email', u'QQ', u'微信标识',
               u'录入员', u'备注'
               ]
    cols_need = [u'员工与老师编号', u'所属分校', u'姓名', u'性别', u'类别',
                 u'是否在职', u'是否是咨询师', u'是否授课', u'职位'
                 ]
    workbook = xlrd.open_workbook(fn)
    worksheets = workbook.sheet_names()

    for page in sheet_pages:
        if page not in worksheets:
            return {'errorCode': 880, 'msg': u'未找到页面[%s]' % page}

    sh = workbook.sheet_by_name(sheet_pages[0])
    cnt = sh.nrows
    if cnt <= 1:
        return {'errorCode': 2000, 'msg': u"无有效数据！"}

    ck = dc_check_col(sh.row_values(0), cols_cn, cols_need)
    if ck['errorCode'] != 0:
        return ck
    cols_num = list(ck['excel_idx'])
    col_idx = list(ck['col_idx'])

    num_right = 0
    num_wrong = 0
    school_ids = DanceSchool.name_to_id()
    class_type = DcClassType.name_id()
    title_dict = DcCommon.title_to_id()

    # 逆序或者顺序遍历。第一行为表头需要过滤掉
    for row in (range(1, cnt) if is_asc else range(cnt - 1, 0, -1)):
        r = sh.row_values(row)
        if r[0] == u'合计':
            continue

        parm = {}
        for i in range(len(cols_num)):
            parm[columns[col_idx[i]]] = r[cols_num[i]]

        # 特殊列的处理
        # 分校名称 转为 分校ID
        school_name = parm['school_id'].lower()
        if school_name in school_ids:
            parm['school_id'] = school_ids[school_name]
        else:
            rec = DanceSchool({'school_name': parm['school_id']})
            db.session.add(rec)

            rec = DanceSchool.query.filter_by(company_id=g.user.id, chool_name=parm['school_id']).first()
            if rec is not None:
                school_ids[school_name] = rec.id
                parm['school_id'] = rec.id
            else:
                raise Exception(u'Can not add new record school[%s]!' % school_name)

        parm['gender'] = gender_v(parm['gender'])
        parm['te_type'] = True if parm['te_type'] == u'专职' else False
        parm['in_job'] = True if parm['in_job'] == u'是' else False
        parm['is_assist'] = True if parm['is_assist'] == u'是' else False
        parm['has_class'] = True if parm['has_class'] == u'是' else False
        if 'class_type' in parm:
            if parm['class_type'] in class_type:
                parm['class_type'] = class_type[parm['class_type']]
            else:
                parm.pop('class_type')
        if parm['te_title'] not in title_dict:
            new_r = DcCommon({'name': parm['te_title'], 'type': COMM_TYPE_JOB_TITLE})
            db.session.add(new_r)
            new_r = DcCommon.query.filter_by(company_id=g.user.company_id, type=COMM_TYPE_JOB_TITLE,
                                             name=parm['te_title']).first()
            if new_r is None:
                raise Exception(u'Add record failed.name={}, type={}'.format(parm['te_title'], COMM_TYPE_JOB_TITLE))
            title_dict[parm['te_title']] = new_r.id
        parm['te_title'] = title_dict[parm['te_title']]

        # -----------------------------------------------------------------------------------------
        # 保证 教职工不能重复 分校id+教职工编号 不能重复
        has = DanceTeacher.query.filter_by(school_id=parm['school_id'], teacher_no=parm['teacher_no']).first()
        if has is None:
            dt = DanceTeacher(parm)
            db.session.add(dt)
            num_right += 1
        else:
            num_wrong += 1  # 重复数据
        # -----------------------------------------------------------------------------------------

        value = int((num_wrong+num_right)*100.0/(cnt-1))
        progressbar[str(g.user.id)]['value'] = value + 1 if value == 0 else value

    progressbar[str(g.user.id)]['value'] = 100
    msg = u'[%s]页%s' % (sh.name, '' if num_right + num_wrong != 0 else u' 无数据！')
    msg += '' if num_right == 0 else (u"导入 %d 条！" % num_right)
    msg += '' if num_wrong == 0 else (u'忽略重复 %d 条。' % num_wrong)

    # 导入 [教育经历] 页面 -------------------------------------------------------------
    teachers = DanceTeacher.no_to_id()
    ret = dc_import_teacher_edu(workbook.sheet_by_name(sheet_pages[1]), teachers)
    msg += ret['msg']
    if ret['errorCode'] != 0:
        return ret

    # 导入 [工作经历] 页面 ----------------------------------------------------------
    ret = dc_import_teacher_work(workbook.sheet_by_name(sheet_pages[2]), teachers)
    msg += ret['msg']
    if ret['errorCode'] != 0:
        return ret

    db.session.commit()
    return {'errorCode': 0, 'msg': msg}


def import_common_degree(fn, is_asc=False):
    """
    :param fn:          文件名，需要导入数据的Excel文件名
    :param is_asc       是否 顺序导入。True 顺序导入， False 逆序导入
    :return:     errorCode     0 成功， 非0 错误
                  msg           信息: 'ok' -- 正确，其他错误,
    """
    sheet_pages = [u'文化程度']
    global progressbar
    progressbar[str(g.user.id)] = {'value': 1, 'sheet': sheet_pages[0]}

    columns = ['name', 'scope', 'recorder']
    cols_cn = [u'文化程度', u'类别', u'录入员']
    cols_need = [u'文化程度', u'类别']
    workbook = xlrd.open_workbook(fn)
    worksheets = workbook.sheet_names()

    for page in sheet_pages:
        if page not in worksheets:
            return {'errorCode': 880, 'msg': u'未找到页面[%s]' % page}

    sh = workbook.sheet_by_name(sheet_pages[0])
    cnt = sh.nrows
    if cnt <= 1:
        return {'errorCode': 2000, 'msg': u"无有效数据！"}

    ck = dc_check_col(sh.row_values(0), cols_cn, cols_need)
    if ck['errorCode'] != 0:
        return ck
    cols_num = list(ck['excel_idx'])
    col_idx = list(ck['col_idx'])

    num_right = 0
    num_wrong = 0

    # 逆序遍历。第一行为表头需要过滤掉
    for row in (range(1, cnt) if is_asc else range(cnt - 1, 0, -1)):
        r = sh.row_values(row)
        if r[0] == u'合计':
            continue

        parm = {}
        for i in range(len(cols_num)):
            parm[columns[col_idx[i]]] = r[cols_num[i]]

        # 特殊列的处理
        # 类别 转为 数值
        scope = parm['scope']
        if scope == u'两者':
            parm['scope'] = DEGREE_SCOPE_ALL
        elif u'学员' in scope:
            parm['scope'] = DEGREE_SCOPE_STUDENT
        else:
            parm['scope'] = DEGREE_SCOPE_TEACHER
        # -----------------------------------------------------------------------------------------
        # 重复校验
        has = DcCommon.query.filter_by(company_id=g.user.company_id, type=COMM_TYPE_DEGREE,
                                       name=parm['name'], scope=parm['scope']).first()
        if has is None:
            parm['type'] = COMM_TYPE_DEGREE
            dt = DcCommon(parm)
            db.session.add(dt)
            num_right += 1
        else:
            num_wrong += 1  # 重复数据
        # -----------------------------------------------------------------------------------------

        value = int((num_wrong+num_right)*100.0/(cnt-1))
        progressbar[str(g.user.id)]['value'] = value + 1 if value == 0 else value

    progressbar[str(g.user.id)]['value'] = 100
    msg = u'[%s]页%s' % (sh.name, '' if num_right + num_wrong != 0 else u' 无数据！')
    msg += '' if num_right == 0 else (u"导入 %d 条！" % num_right)
    msg += '' if num_wrong == 0 else (u'忽略重复 %d 条。' % num_wrong)

    db.session.commit()
    return {'errorCode': 0, 'msg': msg}


def import_common_job_title(fn, is_asc=False):
    """
    :param fn:          文件名，需要导入数据的Excel文件名
    :param is_asc       是否 顺序导入。True 顺序导入， False 逆序导入
    :return:     errorCode     0 成功， 非0 错误
                  msg           信息: 'ok' -- 正确，其他错误,
    """
    sheet_pages = [u'职位信息']
    global progressbar
    progressbar[str(g.user.id)] = {'value': 1, 'sheet': sheet_pages[0]}

    columns = ['name', 'recorder']
    cols_cn = [u'职位名称', u'录入员']
    cols_need = [u'职位名称']
    workbook = xlrd.open_workbook(fn)
    worksheets = workbook.sheet_names()

    for page in sheet_pages:
        if page not in worksheets:
            return {'errorCode': 880, 'msg': u'未找到页面[%s]' % page}

    sh = workbook.sheet_by_name(sheet_pages[0])
    cnt = sh.nrows
    if cnt <= 1:
        return {'errorCode': 2000, 'msg': u"无有效数据！"}

    ck = dc_check_col(sh.row_values(0), cols_cn, cols_need)
    if ck['errorCode'] != 0:
        return ck
    cols_num = list(ck['excel_idx'])
    col_idx = list(ck['col_idx'])

    num_right = 0
    num_wrong = 0

    # 逆序遍历。第一行为表头需要过滤掉
    for row in (range(1, cnt) if is_asc else range(cnt - 1, 0, -1)):
        r = sh.row_values(row)
        if r[0] == u'合计':
            continue

        parm = {}
        for i in range(len(cols_num)):
            parm[columns[col_idx[i]]] = r[cols_num[i]]

        # 特殊列的处理
        # -----------------------------------------------------------------------------------------
        # 重复校验
        has = DcCommon.query.filter_by(company_id=g.user.company_id,
                                       type=COMM_TYPE_JOB_TITLE, name=parm['name']).first()
        if has is None:
            parm['type'] = COMM_TYPE_JOB_TITLE
            dt = DcCommon(parm)
            db.session.add(dt)
            num_right += 1
        else:
            num_wrong += 1  # 重复数据
        # -----------------------------------------------------------------------------------------

        value = int((num_wrong+num_right)*100.0/(cnt-1))
        progressbar[str(g.user.id)]['value'] = value + 1 if value == 0 else value

    progressbar[str(g.user.id)]['value'] = 100
    msg = u'[%s]页%s' % (sh.name, '' if num_right + num_wrong != 0 else u' 无数据！')
    msg += '' if num_right == 0 else (u"导入 %d 条！" % num_right)
    msg += '' if num_wrong == 0 else (u'忽略重复 %d 条。' % num_wrong)

    db.session.commit()
    return {'errorCode': 0, 'msg': msg}


def import_common_intention(fn, is_asc=False):
    """
    :param fn:          文件名，需要导入数据的Excel文件名
    :param is_asc       是否 顺序导入。True 顺序导入， False 逆序导入
    :return:     errorCode     0 成功， 非0 错误
                  msg           信息: 'ok' -- 正确，其他错误,
    """
    sheet_pages = [u'意向程度']
    global progressbar
    progressbar[str(g.user.id)] = {'value': 1, 'sheet': sheet_pages[0]}

    columns = ['name', 'recorder']
    cols_cn = [u'意向程度', u'录入员']
    cols_need = [u'意向程度']
    workbook = xlrd.open_workbook(fn)
    worksheets = workbook.sheet_names()

    for page in sheet_pages:
        if page not in worksheets:
            return {'errorCode': 880, 'msg': u'未找到页面[%s]' % page}
    return dc_common_table(workbook, sheet_pages[0], columns, cols_cn, cols_need, COMM_TYPE_INTENTION, is_asc)


def import_common_consult_mode(fn, is_asc=False):
    """
    :param fn:          文件名，需要导入数据的Excel文件名
    :param is_asc       是否 顺序导入。True 顺序导入， False 逆序导入
    :return:     errorCode     0 成功， 非0 错误
                  msg           信息: 'ok' -- 正确，其他错误,
    """
    sheet_pages = [u'咨询方式']
    global progressbar
    progressbar[str(g.user.id)] = {'value': 1, 'sheet': sheet_pages[0]}

    columns = ['name', 'recorder']
    cols_cn = [u'咨询方式', u'录入员']
    cols_need = [u'咨询方式']
    workbook = xlrd.open_workbook(fn)
    worksheets = workbook.sheet_names()

    for page in sheet_pages:
        if page not in worksheets:
            return {'errorCode': 880, 'msg': u'未找到页面[%s]' % page}
    return dc_common_table(workbook, sheet_pages[0], columns, cols_cn, cols_need, COMM_TYPE_CONSULT_MODE, is_asc)


def import_common_info_src(fn, is_asc=False):
    """
    :param fn:          文件名，需要导入数据的Excel文件名
    :param is_asc       是否 顺序导入。True 顺序导入， False 逆序导入
    :return:     errorCode     0 成功， 非0 错误
                  msg           信息: 'ok' -- 正确，其他错误,
    """
    first_col = u'信息来源'
    sheet_pages = [first_col]
    global progressbar
    progressbar[str(g.user.id)] = {'value': 1, 'sheet': sheet_pages[0]}

    columns = ['name', 'recorder']
    cols_cn = [first_col, u'录入员']
    cols_need = [first_col]
    workbook = xlrd.open_workbook(fn)
    worksheets = workbook.sheet_names()

    for page in sheet_pages:
        if page not in worksheets:
            return {'errorCode': 880, 'msg': u'未找到页面[%s]' % page}
    return dc_common_table(workbook, sheet_pages[0], columns, cols_cn, cols_need, COMM_TYPE_INFO_SRC, is_asc)


def dc_common_table(workbook, sh_name, columns, cols_cn, cols_need, ty, is_asc):
    sh = workbook.sheet_by_name(sh_name)
    cnt = sh.nrows
    if cnt <= 1:
        return {'errorCode': 2000, 'msg': u"无有效数据！"}

    ck = dc_check_col(sh.row_values(0), cols_cn, cols_need)
    if ck['errorCode'] != 0:
        return ck
    cols_num = list(ck['excel_idx'])
    col_idx = list(ck['col_idx'])

    num_right = 0
    num_wrong = 0

    # 逆序遍历。第一行为表头需要过滤掉
    for row in (range(1, cnt) if is_asc else range(cnt - 1, 0, -1)):
        r = sh.row_values(row)
        if r[0] == u'合计':
            continue

        parm = {}
        for i in range(len(cols_num)):
            parm[columns[col_idx[i]]] = r[cols_num[i]]

        # 特殊列的处理
        # -----------------------------------------------------------------------------------------
        # 重复校验
        has = DcCommon.query.filter_by(company_id=g.user.company_id,
                                       type=ty, name=parm['name']).first()
        if has is None:
            parm['type'] = ty
            dt = DcCommon(parm)
            db.session.add(dt)
            num_right += 1
        else:
            num_wrong += 1  # 重复数据
        # -----------------------------------------------------------------------------------------

        value = int((num_wrong+num_right)*100.0/(cnt-1))
        progressbar[str(g.user.id)]['value'] = value + 1 if value == 0 else value

    progressbar[str(g.user.id)]['value'] = 100
    msg = u'[%s]页%s' % (sh.name, '' if num_right + num_wrong != 0 else u' 无数据！')
    msg += '' if num_right == 0 else (u"导入 %d 条！" % num_right)
    msg += '' if num_wrong == 0 else (u'忽略重复 %d 条。' % num_wrong)

    db.session.commit()
    return {'errorCode': 0, 'msg': msg}


def dc_check_col(xlhead, cols_cn, cols_need=None):
    """
    excel 导入检查，检查列名是否存在，并返回 存在的列名和excel文件中对应列的索引
    :param xlhead:      excel文件的表头。在第一行
    :param cols_cn:     需要导入的列名
    :param cols_need:   必须存在的列名，若不存在，则报错
    :return:  dict errorCode   0 -- 成功， 否则 出错
                    msg -- 出错信息
                    excel_idx       excel 文件中列的序号，从 0 开始
                    col_idx         输入参数 cols_cn 在excel文件中有对应列的索引
    """
    excel_idx = []  # excel 对应 列号，从0开始
    col_idx = []    # col_cn中可以在xlhead中找到对应列的列索引，从0开始

    for i in range(len(cols_cn)):
        found = False
        for j in range(len(xlhead)):
            if cols_cn[i] == xlhead[j]:
                found = True
                excel_idx.append(j)
                col_idx.append(i)
                break
        if not found:
            print 'not found col:', cols_cn[i]
            if cols_need is not None and cols_cn[i] in cols_need:
                return {'errorCode': 2000, 'msg': u"文件中未找到列名[%s]！" % cols_cn[i]}

    return {'errorCode': 0, 'msg': 'ok', 'excel_idx': excel_idx, 'col_idx': col_idx}


def dc_import_class_fee(worksheet, receipt, classes):
    """ [收费单（学费）] 导入项目，导入[其他费]sheet 页 """
    global progressbar
    progressbar[str(g.user.id)] = {'value': 1, 'sheet': worksheet.name}
    columns = ['receipt_id', 'class_id', 'term', 'sum', 'discount',
               'discount_rate', 'total', 'real_fee', 'arrearage', 'begin_date',
               'end_date', 'remark']
    cols_cn = [u'收费单号', u'班级编号', u'学期长度', u'优惠前学费', u'优惠',
               u'折扣率', u'应收学费', u'实收学费', u'学费欠费', u'计费日期',
               u'到期日期', u'备注']
    ck = dc_check_col(worksheet.row_values(0), cols_cn)
    if ck['errorCode'] != 0:
        return ck
    cols_num = list(ck['excel_idx'])
    col_idx = list(ck['col_idx'])

    num_right = 0
    num_wrong = 0
    # 逆序遍历。第一行为表头需要过滤掉
    cnt = worksheet.nrows
    for row in range(cnt - 1, 0, -1):
        r = worksheet.row_values(row)
        if r[0] == u'合计':
            continue

        parm = {}
        for i in range(len(cols_num)):
            parm[columns[col_idx[i]]] = r[cols_num[i]]

        if parm['sum'] == '':
            num_wrong += 1      # 没有实际学费的项，过滤掉
            continue

        # 特殊列的处理
        # 收费单号 --> 收费单ID
        parm['receipt_id'] = receipt[parm['receipt_id']].id

        # 班级或课程编号 --> 班级ID
        parm['class_id'] = classes[parm['class_id']].id

        # -----------------------------------------------------------------------------------------
        # 保证 收费单id+班级id 不能重复
        has = DanceClassReceipt.query.filter_by(receipt_id=parm['receipt_id'], class_id=parm['class_id']).first()
        if has is None:
            dcclassreceipt = DanceClassReceipt(parm)
            db.session.add(dcclassreceipt)
            num_right += 1
        else:
            num_wrong += 1  # 重复数据
        # -----------------------------------------------------------------------------------------

        value = int((num_wrong + num_right) * 100.0 / (cnt - 1))
        progressbar[str(g.user.id)]['value'] = value + 1 if value == 0 else value

    progressbar[str(g.user.id)]['value'] = 100
    msg = '[' + worksheet.name + u']页 '
    msg += '' if num_right == 0 else (u"导入 %d 条！" % num_right)
    msg += '' if num_wrong == 0 else (u'忽略重复或无效 %d 条。' % num_wrong)
    return {'errorCode': 0, 'msg': msg}


def dc_import_other_fee(worksheet, receipt, classes, feeitem):
    """ [收费单（学费）] 导入项目，导入[其他费]sheet 页 """
    global progressbar
    progressbar[str(g.user.id)] = {'value': 1, 'sheet': worksheet.name}
    columns = ['receipt_id', 'class_id', 'fee_item_id', 'summary', 'real_fee',
               'remark']
    cols_cn = [u'收费单号', u'班级或课程编号', u'收费项目', u'摘要', u'收费',
               u'备注']

    num_right = 0
    num_wrong = 0

    cnt = worksheet.nrows
    ck = dc_check_col(worksheet.row_values(0), cols_cn)
    if ck['errorCode'] != 0:
        return ck
    cols_num = list(ck['excel_idx'])
    col_idx = list(ck['col_idx'])

    # 逆序遍历。第一行为表头需要过滤掉
    for row in range(cnt - 1, 0, -1):
        r = worksheet.row_values(row)
        if r[0] == u'合计':
            continue

        parm = {}
        for i in range(len(cols_num)):
            parm[columns[col_idx[i]]] = r[cols_num[i]]

        # 特殊列的处理
        # 收费单号 --> 收费单ID
        parm['receipt_id'] = receipt[parm['receipt_id']].id

        # 班级或课程编号 --> 班级ID
        if parm['class_id'] != '':
            parm['class_id'] = classes[parm['class_id']].id

        # 收费项目 --> 收费ID
        feename = parm['fee_item_id']
        if feename in feeitem:
            parm['fee_item_id'] = feeitem[feename].id
        else:
            fee = DcFeeItem(feename)
            db.session.add(fee)
            fee = DcFeeItem.query.filter_by(company_id=g.user.company_id).filter_by(fee_item=feename).first()
            feeitem[feename] = fee
            parm['fee_item_id'] = fee.id

        # -----------------------------------------------------------------------------------------
        # 保证 信息(收费单id+班级id+收费项目id+摘要+收费+备注) 不能重复
        has = DanceOtherFee.query.filter_by(receipt_id=parm['receipt_id'], class_id=parm['class_id'],
                                            fee_item_id=parm['fee_item_id'], summary=parm['summary'],
                                            remark=parm['remark'])\
            .filter(DanceOtherFee.real_fee <= float(parm['real_fee'])+DANCE_PRECISION,
                    DanceOtherFee.real_fee >= float(parm['real_fee'])-DANCE_PRECISION).first()
        if has is None:
            record = DanceOtherFee(parm)
            db.session.add(record)
            num_right += 1
        else:
            num_wrong += 1  # 重复数据
            # -----------------------------------------------------------------------------------------

        value = int((num_wrong + num_right) * 100.0 / (cnt - 1))
        progressbar[str(g.user.id)]['value'] = value + 1 if value == 0 else value

    progressbar[str(g.user.id)]['value'] = 100
    msg = '[' + worksheet.name + u']页 '
    msg += '' if num_right == 0 else (u"导入 %d 条！" % num_right)
    msg += '' if num_wrong == 0 else (u'忽略重复 %d 条。' % num_wrong)
    return {'errorCode': 0, 'msg': msg}


def dc_import_teaching_fee(worksheet, receipt, classes, material):
    """ [收费单（学费）] 导入项，导入[教材费]sheet 页 """
    global progressbar
    progressbar[str(g.user.id)] = {'value': 1, 'sheet': worksheet.name}
    columns = ['receipt_id', 'class_id', 'material_id', 'is_got', 'fee',
               'remark']
    cols_cn = [u'收费单号', u'班级或课程编号', u'教材编号', u'是否领取', u'教材费',
               u'备注']
    cols_need = [u'收费单号', u'教材编号', u'教材费']

    num_right = 0
    num_wrong = 0

    cnt = worksheet.nrows
    ck = dc_check_col(worksheet.row_values(0), cols_cn, cols_need)
    if ck['errorCode'] != 0:
        return ck
    cols_num = list(ck['excel_idx'])
    col_idx = list(ck['col_idx'])

    # 逆序遍历。第一行为表头需要过滤掉
    for row in range(cnt - 1, 0, -1):
        r = worksheet.row_values(row)
        if r[0] == u'合计':
            continue

        parm = {}
        for i in range(len(cols_num)):
            parm[columns[col_idx[i]]] = r[cols_num[i]]

        # 特殊列的处理
        # 收费单号 --> 收费单ID
        parm['receipt_id'] = receipt[parm['receipt_id']].id

        # 班级或课程编号 --> 班级ID
        if parm['class_id'] != '':
            parm['class_id'] = classes[parm['class_id']].id

        # 教材编号 --> 教材ID
        parm['material_id'] = material[parm['material_id']].id

        # -----------------------------------------------------------------------------------------
        # 保证 信息(收费单id+班级id+收费项目id+摘要+收费+备注) 不能重复
        has = DanceTeaching.query.filter_by(receipt_id=parm['receipt_id'], material_id=parm['material_id'],
                                            class_id=parm['class_id'], remark=parm['remark']).first()
        if has is None:
            record = DanceTeaching(parm)
            db.session.add(record)
            num_right += 1
        else:
            num_wrong += 1  # 重复数据
            # -----------------------------------------------------------------------------------------

        value = int((num_wrong + num_right) * 100.0 / (cnt - 1))
        progressbar[str(g.user.id)]['value'] = value + 1 if value == 0 else value

    progressbar[str(g.user.id)]['value'] = 100
    msg = '[' + worksheet.name + u']页 '
    msg += '' if num_right == 0 else (u"导入 %d 条！" % num_right)
    msg += '' if num_wrong == 0 else (u'忽略重复 %d 条。' % num_wrong)
    return {'errorCode': 0, 'msg': msg}


def dc_import_student_class(worksheet):
    """ [报名登记] 导入项，导入[班级——选择班级]sheet 页 """
    global progressbar
    progressbar[str(g.user.id)] = {'value': 1, 'sheet': worksheet.name}

    columns = ['student_id', 'class_id', 'join_date', 'status', 'remark']
    cols_cn = [u'学号', u'班级编号', u'报班日期', u'状态', u'报班备注']

    ck = dc_check_col(worksheet.row_values(0), cols_cn, cols_cn)
    if ck['errorCode'] != 0:
        return ck
    cols_num = list(ck['excel_idx'])
    col_idx = list(ck['col_idx'])

    num_right = 0
    num_wrong = 0
    # 逆序遍历。第一行为表头需要过滤掉
    cnt = worksheet.nrows
    for row in range(cnt - 1, 0, -1):
        r = worksheet.row_values(row)
        if r[0] == u'合计':
            continue

        parm = {}
        for i in range(len(cols_num)):
            parm[columns[col_idx[i]]] = r[cols_num[i]]

        # 特殊列的处理

        # -----------------------------------------------------------------------------------------
        # （学号+班级ID）不能重复
        has = DanceStudentClass.query.filter_by(company_id=g.user.company_id).filter_by(
            student_id=parm['student_id'], class_id=parm['class_id']).first()
        if has is None:
            record = DanceStudentClass(parm)
            db.session.add(record)
            num_right += 1
        else:
            num_wrong += 1  # 重复数据
        # -----------------------------------------------------------------------------------------

        value = int((num_wrong + num_right) * 100.0 / (cnt - 1))
        progressbar[str(g.user.id)]['value'] = value + 1 if value == 0 else value

    progressbar[str(g.user.id)]['value'] = 100
    msg = '[' + worksheet.name + u']页 '
    msg += '' if num_right == 0 else (u"导入 %d 条！" % num_right)
    msg += '' if num_wrong == 0 else (u'忽略重复 %d 条。' % num_wrong)
    return {'errorCode': 0, 'msg': msg}


def import_teaching_material(fn):
    """
    :param fn:   文件名，需要导入数据的Excel文件名
    :return:     errorCode     0 成功， 非0 错误
                  msg           信息: 'ok' -- 正确，其他错误,
    """
    sheet_pages = [u'教材信息']
    global progressbar
    progressbar[str(g.user.id)] = {'value': 1, 'sheet': sheet_pages[0]}

    columns = ['material_no', 'material_name', 'rem_code', 'unit', 'price_buy',
               'price_sell', 'summary', 'is_use', 'remark', 'recorder',
               'tm_type']
    cols_cn = [u'教材编号', u'教材名称', u'助记码', u'单位', u'进价',
               u'售价', u'内容简介', u'是否启用', u'备注', u'录入员',
               u'类别']
    cols_need = [u'教材编号', u'教材名称', u'单位', u'类别']
    workbook = xlrd.open_workbook(fn)
    worksheets = workbook.sheet_names()

    for page in sheet_pages:
        if page not in worksheets:
            return {'errorCode': 880, 'msg': u'未找到页面[%s]' % page}

    sh = workbook.sheet_by_name(sheet_pages[0])
    cnt = sh.nrows
    if cnt <= 1:
        return {'errorCode': 2000, 'msg': u"无有效数据！"}

    ck = dc_check_col(sh.row_values(0), cols_cn, cols_need)
    if ck['errorCode'] != 0:
        return ck
    cols_num = list(ck['excel_idx'])
    col_idx = list(ck['col_idx'])

    num_right = 0
    num_wrong = 0

    # 逆序遍历。第一行为表头需要过滤掉
    for row in range(cnt - 1, 0, -1):
        r = sh.row_values(row)
        if r[0] == u'合计':
            continue

        parm = {}
        for i in range(len(cols_num)):
            parm[columns[col_idx[i]]] = r[cols_num[i]]

        # 特殊列的处理============

        # -----------------------------------------------------------------------------------------
        # 保证 教材编号+公司id 不能重复
        has = DcTeachingMaterial.query.filter_by(material_no=parm['material_no'], company_id=g.user.company_id).first()
        if has is None:
            record = DcTeachingMaterial(parm)
            db.session.add(record)
            num_right += 1
        else:
            num_wrong += 1  # 重复数据
        # -----------------------------------------------------------------------------------------

        value = int((num_wrong+num_right)*100.0/(cnt-1))
        progressbar[str(g.user.id)]['value'] = value + 1 if value == 0 else value

    progressbar[str(g.user.id)]['value'] = 100
    msg = u'[%s]页%s' % (sh.name, '' if num_right + num_wrong != 0 else u' 无数据！')
    msg += '' if num_right == 0 else (u"导入 %d 条！" % num_right)
    msg += '' if num_wrong == 0 else (u'忽略重复 %d 条。' % num_wrong)

    db.session.commit()
    return {'errorCode': 0, 'msg': msg}


def dc_import_teacher_edu(worksheet, teachers):
    """ [ 员工与老师 ] 导入项目，导入[ 教育经历 ]sheet 页
    输入信息：
        worksheet:      Excel 工作区页面
        teachers:       教职工编号--> 教职工记录id dict
    """
    global progressbar
    progressbar[str(g.user.id)] = {'value': 1, 'sheet': worksheet.name}
    columns = ['teacher_id', 'begin_day', 'end_day', 'school', 'major',
               'remark']
    cols_cn = [u'员工与老师编号', u'起始年月', u'结束年月', u'所在学校', u'专业及学历',
               u'备注']

    num_right = 0
    num_wrong = 0

    cnt = worksheet.nrows
    ck = dc_check_col(worksheet.row_values(0), cols_cn)
    if ck['errorCode'] != 0:
        return ck
    cols_num = list(ck['excel_idx'])
    col_idx = list(ck['col_idx'])

    # 逆序遍历。第一行为表头需要过滤掉
    for row in range(cnt - 1, 0, -1):
        r = worksheet.row_values(row)
        if r[0] == u'合计':
            continue

        parm = {}
        for i in range(len(cols_num)):
            parm[columns[col_idx[i]]] = r[cols_num[i]]

        # 特殊列的处理
        # 教职工编号 --> 教职工ID
        parm['teacher_id'] = teachers[parm['teacher_id']]

        # -----------------------------------------------------------------------------------------
        # 保证 信息(员工与老师id+起始年月+结束年月) 不能重复
        has = DanceTeacherEdu.query.filter_by(teacher_id=parm['teacher_id'], begin_day=parm['begin_day'],
                                              end_day=parm['end_day']).first()
        if has is None:
            record = DanceTeacherEdu(parm)
            db.session.add(record)
            num_right += 1
        else:
            num_wrong += 1  # 重复数据
            # -----------------------------------------------------------------------------------------

        value = int((num_wrong + num_right) * 100.0 / (cnt - 1))
        progressbar[str(g.user.id)]['value'] = value + 1 if value == 0 else value

    progressbar[str(g.user.id)]['value'] = 100
    msg = '[' + worksheet.name + u']页 %s' % ('' if num_right+num_wrong != 0 else u'为空。')
    msg += '' if num_right == 0 else (u"导入 %d 条！" % num_right)
    msg += '' if num_wrong == 0 else (u'忽略重复 %d 条。' % num_wrong)
    return {'errorCode': 0, 'msg': msg}


def dc_import_teacher_work(worksheet, teachers):
    """ [ 员工与老师 ] 导入项目，导入[ 教育经历 ]sheet 页
    输入信息：
        worksheet:      Excel 工作区页面
        teachers:       教职工编号--> 教职工记录id dict
    """
    global progressbar
    progressbar[str(g.user.id)] = {'value': 1, 'sheet': worksheet.name}
    columns = ['teacher_id', 'begin_day', 'end_day', 'firm', 'position',
               'content', 'remark']
    cols_cn = [u'员工与老师编号', u'起始年月', u'结束年月', u'所在单位', u'岗位或职位',
               u'主要工作', u'备注']

    num_right = 0
    num_wrong = 0

    cnt = worksheet.nrows
    ck = dc_check_col(worksheet.row_values(0), cols_cn)
    if ck['errorCode'] != 0:
        return ck
    cols_num = list(ck['excel_idx'])
    col_idx = list(ck['col_idx'])

    # 逆序遍历。第一行为表头需要过滤掉
    for row in range(cnt - 1, 0, -1):
        r = worksheet.row_values(row)
        if r[0] == u'合计':
            continue

        parm = {}
        for i in range(len(cols_num)):
            parm[columns[col_idx[i]]] = r[cols_num[i]]

        # 特殊列的处理
        # 教职工编号 --> 教职工ID
        parm['teacher_id'] = teachers[parm['teacher_id']]

        # -----------------------------------------------------------------------------------------
        # 保证 信息(员工与老师id+起始年月+结束年月) 不能重复
        has = DanceTeacherWork.query.filter_by(teacher_id=parm['teacher_id'], begin_day=parm['begin_day'],
                                               end_day=parm['end_day']).first()
        if has is None:
            record = DanceTeacherWork(parm)
            db.session.add(record)
            num_right += 1
        else:
            num_wrong += 1  # 重复数据
            # -----------------------------------------------------------------------------------------

        value = int((num_wrong + num_right) * 100.0 / (cnt - 1))
        progressbar[str(g.user.id)]['value'] = value + 1 if value == 0 else value

    progressbar[str(g.user.id)]['value'] = 100
    msg = '[' + worksheet.name + u']页 %s' % ('' if num_right+num_wrong != 0 else u'为空。')
    msg += '' if num_right == 0 else (u"导入 %d 条！" % num_right)
    msg += '' if num_wrong == 0 else (u'忽略重复 %d 条。' % num_wrong)
    return {'errorCode': 0, 'msg': msg}


def export_student(fn, sheet_name, cols_wanted=None):
    """
    将学员 报名 登记 信息 从数据库导出
    :param fn:                  要导出的文件及路径，存于服务器，先从DB导出Excel，再由用户下载该文件
    :param sheet_name:          写入Excel的 Sheet 页名
    :param cols_wanted:         optional 要导出的 数据库 列名，为None，则导出数据库的所有列
    :return:                    1. errorCode  0--成功，其他--失败
                                 2. msg  若errorCode==0,msg=='ok', 其他情况，则为具体的错误信息
    """
    columns = ['sno', 'school_id', 'consult_no', 'name', 'rem_code',
               'gender', 'degree', 'birthday', 'register_day', 'information_source',
               'counselor', 'reading_school', 'grade', 'phone', 'tel',
               'address', 'zipcode', 'email', 'qq', 'wechat',
               'mother_name', 'mother_phone', 'mother_tel', 'mother_company', 'card',
               'father_name', 'father_phone', 'father_tel', 'father_company', 'points',
               'is_training', 'remark', 'recorder', 'idcard', 'mother_wechat',
               'father_wechat']
    cols_cn = [u'学号', u'分校名称', u'咨询编号', u'姓名', u'助记码',
               u'性别', u'文化程度', u'出生日期', u'登记日期', u'信息来源',
               u'咨询师', u'所在学校', u'年级', u'本人手机', u'固定电话',
               u'联系地址', u'邮政编码', u'Email', u'QQ', u'微信标识',
               u'母亲姓名', u'母亲手机', u'母亲固话', u'母亲工作单位', u'卡号',
               u'父亲姓名', u'父亲手机', u'父亲固话', u'父亲工作单位', u'赠送积分',
               u'是否在读', u'备注', u'录入员', u'身份证', u'母亲微信标识',
               u'父亲微信标识'
               ]
    cols_num = []

    if cols_wanted is None:
        cols_wanted = columns

    for i in range(len(cols_wanted)):
        j = 0
        for j in range(len(columns)):
            if cols_wanted[i] == columns[j]:
                cols_num.append(j)
                break
        if j == len(columns):
            return 300, u'存在无效列名[%s]' % cols_wanted[i]

    wb = xlwt.Workbook(encoding='utf-8')
    style = xlwt.XFStyle()
    font = xlwt.Font()
    font.name = u'宋体'  # 宋体 SimSun
    style.font = font
    sheet = wb.add_sheet(sheet_name)

    ####################################################################################
    # 在此控制导出分校
    school_ids, school_map = DanceUserSchool.get_school_map_by_uid()
    records = DanceStudent.query.filter(DanceStudent.school_id.in_(school_ids)).all()
    row_count = len(records)
    col_count = len(cols_num)
    for row in range(0, row_count):
        for col in range(0, col_count):
            if row == 0:
                sheet.write(row, col, cols_cn[cols_num[col]], style)
            else:
                val = records[row].getval(columns[cols_num[col]])
                # --- 特殊列处理 --- school_id 转为 分校名称 -------------
                if columns[cols_num[col]] == 'school_id':
                    sheet.write(row, col, school_map[val], style)
                else:
                    sheet.write(row, col, val, style)

    wb.save(fn)
    return 0, 'ok'
