# -*- coding:utf-8 -*-
import xlrd                 # 读取 Excel 模块
import xlwt                 # Excel 写模块
from pyExcelerator import *     # 写入Excel 模块
from app import db
from app.models import DanceStudent, DanceClass, DanceStudentClass, DanceSchool, DanceCompany, DanceUserSchool
from flask import g


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


def read_excel(fn):
    workbook = xlrd.open_workbook(fn)
    worksheets = workbook.sheet_names()

    data_ret = {}
    for sheet in worksheets:
        sh = workbook.sheet_by_name(sheet)      # workbook.sheet_by_index()
        row = sh.nrows
        row_list = []
        for r in range(row):
            row_data = sh.row_values(r)
            row_list.append(row_data)           # sh.cell_value(0, 0), 获取第0行第0列数据

        data_ret[sheet] = row_list

    return data_ret


# print read_excel('D:/1.xlsx')
# print read_excel( u'D:\\师之伴侣数据备份\\报名登记_2017-08-21_13-09-34.xls')


def test_write():
    w = Workbook()  # 创建一个工作簿
    ws = w.add_sheet('Hey, Hades')  # 创建一个工作表
    ws.write(0, 0, 'bit')  # 在1行1列写入bit
    ws.write(0, 1, 'huang')  # 在1行2列写入huang
    ws.write(1, 0, 'xuan')  # 在2行1列写入xuan
    w.save('d:/mini.xls')  # 保存     ，无法保存 xlsx 格式的文件


def write_excel_test():
    datas = [['a', 'b', 'c'], ['d', 'e', 'f'], ['g', 'h']]  # 二维数组
    file_path = 'D:\\test.xls'

    wb = xlwt.Workbook()
    sheet = wb.add_sheet('test')  # sheet的名称为test

    # 单元格的格式
    style = 'pattern: pattern solid, fore_colour yellow; '  # 背景颜色为黄色
    style += 'font: bold on; '  # 粗体字
    style += 'align: horz centre, vert center; '  # 居中
    header_style = xlwt.easyxf(style)

    row_count = len(datas)
    for row in range(0, row_count):
        col_count = len(datas[row])
        for col in range(0, col_count):
            if row == 0:  # 设置表头单元格的格式
                sheet.write(row, col, datas[row][col], header_style)
            else:
                sheet.write(row, col, datas[row][col])
    wb.save(file_path)


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
