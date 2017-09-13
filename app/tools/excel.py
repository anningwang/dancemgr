# -*- coding:utf-8 -*-
import xlrd                 # 读取 Excel 模块
import xlwt                 # Excel 写模块
from app import db
from app.models import DanceStudent, DanceClass, DanceStudentClass, DanceSchool, DanceReceipt, DanceUserSchool
from flask import g

progressbar = {}         # 进度条的值  用户id(key) = value


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


def import_student(fn):
    """
    :param fn:   文件名，需要导入数据的Excel文件名
    :return:     读取的 Excel 数据,
                  信息: 'ok' -- 正确，其他错误,
                  正确存入条数,
                  错误条数
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
    data_ret = {}
    num_right = 0
    num_wrong = 0
    workbook = xlrd.open_workbook(fn)
    worksheets = workbook.sheet_names()
    for sheet in worksheets:
        if sheet != u'报名登记':
            continue
        sh = workbook.sheet_by_name(sheet)
        row = sh.nrows
        if row <= 1:
            return data_ret, u"无有效数据！", num_right, num_wrong
        row_list = [sh.row_values(0)]

        for o in cols_cn:
            p = 0
            for p in range(len(sh.row_values(0))):
                if o == sh.row_values(0)[p]:
                    cols_num.append(p)
                    break
            if p == len(sh.row_values(0)):
                return data_ret, u"文件中未找到列名[%s]！" % o, num_right, num_wrong

        school_ids = DanceSchool.get_school_id_list()
        # 逆序遍历。第一行为表头需要过滤掉
        for rows in range(row - 1, 0, -1):
            row_data = sh.row_values(rows)
            row_list.append(row_data)
            rowdict = {}

            for i in range(len(cols_num)):
                rowdict[columns[i]] = row_data[cols_num[i]]

            ####################################################################################
            # 特殊列的处理
            # ---分校名称--转换为--分校ID---存入数据库
            if rowdict['school_id'].lower() not in school_ids:
                raise Exception(u'分校[%s]不存在！' % rowdict['school_id'])
            school_id = school_ids[rowdict['school_id'].lower()]
            rowdict['school_id'] = school_id

            ####################################################################################
            # 保证学号不能重复
            has = DanceStudent.query.filter_by(school_id=school_id).filter_by(sno=row_data[0]).first()
            if has is None:
                tb = DanceStudent(rowdict)
                db.session.add(tb)
                num_right += 1
            else:
                num_wrong += 1  # 重复数据
            ####################################################################################
        db.session.commit()
        data_ret[sheet] = row_list

    return data_ret, "ok", num_right, num_wrong


def import_class(fn):
    """
    :param fn:   文件名，需要导入数据的Excel文件名
    :return:     1. 读取的 Excel 数据,
                  2. 信息: 'ok' -- 正确，其他错误,
                  3. 正确存入条数,
                  4. 错误条数
    """
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
    cols_num = []
    data_ret = {}
    num_right = 0
    num_wrong = 0
    workbook = xlrd.open_workbook(fn)
    worksheets = workbook.sheet_names()
    for sheet in worksheets:
        if sheet != u'班级信息':
            continue
        sh = workbook.sheet_by_name(sheet)
        row = sh.nrows
        if row <= 1:
            return data_ret, u"无有效数据！", num_right, num_wrong
        row_list = [sh.row_values(0)]

        for o in cols_cn:
            p = 0
            for p in range(len(sh.row_values(0))):
                if o == sh.row_values(0)[p]:
                    cols_num.append(p)
                    break
            if p == len(sh.row_values(0)):
                return data_ret, u"文件中未找到列名[%s]！" % o, num_right, num_wrong

        school_ids = DanceSchool.get_school_id_list()
        # 逆序遍历。最后一行为合计和第一行为表头需要过滤掉
        for rows in range(row-2, 0, -1):
            row_data = sh.row_values(rows)
            row_list.append(row_data)
            rowdict = {}

            for i in range(len(cols_num)):
                rowdict[columns[i]] = row_data[cols_num[i]]

            ####################################################################################
            # 特殊列的处理
            if 'is_ended' in rowdict:
                rowdict['is_ended'] = 1 if rowdict['is_ended'] == u'是' else 0
            if rowdict['school_id'].lower() not in school_ids:
                raise Exception(u'分校[%s]不存在！' % rowdict['school_id'])
            school_id = school_ids[rowdict['school_id'].lower()]
            rowdict['school_id'] = school_id

            ####################################################################################
            # 保证班级不能重复
            has = DanceClass.query.filter_by(school_id=school_id).filter_by(cno=row_data[0]).first()
            if has is None:
                record = DanceClass(rowdict)
                db.session.add(record)
                num_right += 1
            else:
                num_wrong += 1  # 重复数据
            ####################################################################################
        db.session.commit()
        data_ret[sheet] = row_list

    return data_ret, "ok", num_right, num_wrong


def import_receipt(fn):
    """
    :param fn:   文件名，需要导入数据的Excel文件名
    :return:     errorCode     0 成功， 非0 错误
                  msg           信息: 'ok' -- 正确，其他错误,
    """
    global progressbar
    progressbar[str(g.user.id)] = 1
    columns = ['receipt_no', 'school_id', 'student_id', 'deal_date', 'receivable_fee',
               'teaching_fee', 'other_fee', 'total', 'real_fee', 'arrearage',
               'counselor', 'remark', 'recorder', 'fee_mode']
    cols_cn = [u'收费单号', u'分校名称', u'学号', u'收费日期', u'应收学费',
               u'教材费', u'其他费', u'费用合计', u'实收费', u'学费欠费',
               u'咨询师', u'备注', u'录入员', u'收费方式']
    cols_num = []
    num_right = 0
    num_wrong = 0
    workbook = xlrd.open_workbook(fn)
    worksheets = workbook.sheet_names()

    sheet_pages = [u'收费单', u'班级——学费', u'教材费', u'其他费']
    for page in sheet_pages:
        if page not in worksheets:
            return {'errorCode': 880, 'msg': u'未找到页面[%s]' % page}

    sh = workbook.sheet_by_name(sheet_pages[0])
    cnt = sh.nrows
    if cnt <= 1:
        return {'errorCode': 2000, 'msg': u"无有效数据！"}

    for o in cols_cn:
        p = 0
        for p in range(len(sh.row_values(0))):
            if o == sh.row_values(0)[p]:
                cols_num.append(p)
                break
        if p == len(sh.row_values(0)):
            return {'errorCode': 2000, 'msg': u"文件中未找到列名[%s]！" % o}

    school_ids = DanceSchool.get_school_id_list()
    # 逆序遍历。第一行为表头需要过滤掉
    for row in range(cnt - 1, 0, -1):
        r = sh.row_values(row)
        if r[0] == u'合计':
            continue

        para = {}
        for i in range(len(cols_num)):
            para[columns[i]] = r[cols_num[i]]

        ####################################################################################
        # 特殊列的处理
        # ---分校名称--转换为--分校ID---存入数据库
        if para['school_id'].lower() not in school_ids:
            raise Exception(u'分校[%s]不存在！' % para['school_id'])
        school_id = school_ids[para['school_id'].lower()]
        para['school_id'] = school_id

        # 学号 转 学员id
        student_id = DanceStudent.get_id(school_id, para['student_id'])
        if student_id == -1:
            raise Exception(u'学号[%s]的学员不存在！' % para['student_id'])

        para['student_id'] = student_id

        ####################################################################################
        # 保证学号不能重复
        has = DanceReceipt.query.filter_by(school_id=school_id).filter_by(receipt_no=r[0])\
            .filter_by(student_id=student_id).first()
        if has is None:
            tb = DanceReceipt(para)
            db.session.add(tb)
            num_right += 1
        else:
            num_wrong += 1  # 重复数据
        ####################################################################################

        value = int((num_wrong+num_right)*100.0/(cnt-1))
        progressbar[str(g.user.id)] = value + 1 if value == 0 else value
    db.session.commit()

    progressbar[str(g.user.id)] = 100
    msg = u"成功导入 %d 条数据！" % num_right
    msg += '' if num_wrong == 0 else (u'重复数据 %d 条。' % num_wrong)
    return {'errorCode': 0, 'msg': msg}


def import_student_class(fn, sheet_name):
    columns = ['student_id', 'class_id', 'join_date', 'status', 'remark']
    cols_cn = [u'学号', u'班级编号', u'报班日期', u'状态', u'报班备注']
    cols_num = []
    data_ret = {}
    num_right = 0
    num_wrong = 0
    workbook = xlrd.open_workbook(fn)
    worksheets = workbook.sheet_names()
    for sheet in worksheets:
        if sheet != sheet_name:
            continue
        sh = workbook.sheet_by_name(sheet)
        row = sh.nrows
        if row <= 1:
            return data_ret, u"无有效数据！", num_right, num_wrong
        row_list = [sh.row_values(0)]

        for o in cols_cn:
            p = 0
            for p in range(len(sh.row_values(0))):
                if o == sh.row_values(0)[p]:
                    cols_num.append(p)
                    break
            if p == len(sh.row_values(0)):
                return data_ret, u"文件中未找到列名[%s]！" % o, num_right, num_wrong

        for rows in range(1, row):
            row_data = sh.row_values(rows)
            row_list.append(row_data)
            rowdict = {}

            for i in range(len(cols_num)):
                rowdict[columns[i]] = row_data[cols_num[i]]

            ####################################################################################
            # 特殊列的处理

            ####################################################################################
            # 保证（学号+班级ID）不能重复
            has = DanceStudentClass.query.filter_by(company_id=g.user.company_id).filter_by(
                student_id=row_data[cols_num[0]], class_id=row_data[cols_num[1]]).first()
            if has is None:
                record = DanceStudentClass(rowdict)
                db.session.add(record)
                num_right += 1
            else:
                num_wrong += 1  # 重复数据
            ####################################################################################

        db.session.commit()
        data_ret[sheet] = row_list

    return data_ret, "ok", num_right, num_wrong


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
