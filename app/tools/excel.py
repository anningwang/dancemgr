# -*- coding:utf-8 -*-
import xlrd                 # 读取 Excel 模块
import xlwt                 # Excel 写模块
from pyExcelerator import *     # 写入Excel 模块
from app import db
from app.models import DanceStudent, DanceClass, DanceStudentClass


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


def student_import_to_db(fn):
    """
    :param fn:   文件名，需要导入数据的Excel文件名
    :return:     读取的 Excel 数据,
                  信息: 'ok' -- 正确，其他错误,
                  正确存入条数,
                  错误条数
    """
    workbook = xlrd.open_workbook(fn)
    worksheets = workbook.sheet_names()
    columns = ['sno', 'school_no', 'school_name', 'consult_no', 'name', 'rem_code', 'gender', 'degree',
               'birthday', 'register_day', 'information_source', 'counselor', 'reading_school',
               'grade', 'phone', 'tel', 'address', 'zipcode', 'email', 'qq',
               'wechat', 'mother_name', 'mother_phone', 'mother_tel', 'mother_company',
               'father_name', 'father_phone', 'father_tel', 'father_company',
               'card', 'is_training', 'points', 'remark', 'recorder']
    data_ret = {}
    num_right = 0
    num_wrong = 0
    not_found = True
    for sheet in worksheets:
        if sheet != u'报名登记':
            continue

        not_found = False
        sh = workbook.sheet_by_name(sheet)      # workbook.sheet_by_index()
        row = sh.nrows
        row_list = [sh.row_values(0)]

        count = row - 1     # 倒序添加到数据库，因为导出的excel是按照 登记日期 倒序排列的。
        while count > 0:
            row_data = sh.row_values(count)
            row_list.append(row_data)           # sh.cell_value(0, 0), 获取第0行第0列数据
            rowdict = {}

            if len(row_data) < len(columns):
                return data_ret, "数据长度错误", num_right, num_wrong

            for i in range(len(columns)):
                rowdict[columns[i]] = row_data[i]

            # 保证学号不能重复
            has = DanceStudent.query.filter_by(sno=row_data[0]).first()
            if has is None:
                tb = DanceStudent(rowdict)
                db.session.add(tb)
                num_right += 1
            else:
                num_wrong += 1      # 重复数据
            count -= 1

        db.session.commit()
        data_ret[sheet] = row_list

    if not_found:
        return data_ret, u"未找到名为[报名登记]的sheet页！", num_right, num_wrong

    return data_ret, "ok", num_right, num_wrong


def class_import_to_db(fn):
    """
    :param fn:   文件名，需要导入数据的Excel文件名
    :return:     1. 读取的 Excel 数据,
                  2. 信息: 'ok' -- 正确，其他错误,
                  3. 正确存入条数,
                  4. 错误条数
    """
    workbook = xlrd.open_workbook(fn)
    worksheets = workbook.sheet_names()

    # table columns name
    columns = ['cno', 'school_no', 'school_name', 'class_name', 'rem_code',
               'begin_year', 'class_type', 'class_style', 'teacher', 'cost_mode',
               'cost', 'plan_students', 'cur_students', 'is_ended', 'remark',
               'recorder'
               ]

    # Excel文件中 和 上面 表列 对应的 列号，从 第 A 列开始
    excel_col = ['A', 'B', 'C', 'D', 'E',
                 'F', 'J', 'K', 'L', 'M',
                 'N', 'P', 'R', 'S', 'T',
                 'U'
                 ]

    data_ret = {}
    num_right = 0
    num_wrong = 0

    checked, msg = check_excel_col_name(excel_col)

    if not checked:
        print msg
        return data_ret, msg, num_right, num_wrong

    excel_col_num = excel_col2int(excel_col)
    for sheet in worksheets:
        if sheet != u'班级信息':
            continue
        sh = workbook.sheet_by_name(sheet)      # workbook.sheet_by_index()
        row = sh.nrows
        row_list = [sh.row_values(0)]
        # 最后一条为 “合计” 行，故 减一： row-1
        for rows in range(1, row-1):
            row_data = sh.row_values(rows)
            row_list.append(row_data)           # sh.cell_value(0, 0), 获取第0行第0列数据
            rowdict = {}

            if len(row_data) < len(columns) or len(row_data) < max(excel_col_num):
                return data_ret, "数据长度错误", num_right, num_wrong

            for i in range(len(columns)):
                rowdict[columns[i]] = row_data[excel_col_num[i]-1]

            # 保证班级不能重复
            has = DanceClass.query.filter_by(cno=row_data[0]).first()
            if has is None:
                record = DanceClass(rowdict)
                db.session.add(record)
                num_right += 1
            else:
                num_wrong += 1      # 重复数据

        db.session.commit()
        data_ret[sheet] = row_list

    return data_ret, "ok", num_right, num_wrong


def student_class_import_to_db(fn, sheet_name):
    workbook = xlrd.open_workbook(fn)
    worksheets = workbook.sheet_names()

    columns = ['student_id', 'class_id', 'join_date', 'status', 'remark']
    cols_cn = [u'学号', u'班级编号', u'报班日期', u'状态', u'报班备注']
    cols_num = []

    data_ret = {}
    num_right = 0
    num_wrong = 0

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
            row_list.append(row_data)           # sh.cell_value(0, 0), 获取第0行第0列数据
            rowdict = {}

            if len(row_data) < len(columns):
                return data_ret, u"数据长度错误！", num_right, num_wrong

            for i in range(len(columns)):
                rowdict[columns[i]] = row_data[cols_num[i]]

            # 保证（学号+班级ID）不能重复
            has = DanceStudentClass.query.filter_by(
                student_id=row_data[cols_num[0]], class_id=row_data[cols_num[1]]).first()
            if has is None:
                record = DanceStudentClass(rowdict)
                db.session.add(record)
                num_right += 1
            else:
                num_wrong += 1      # 重复数据

        db.session.commit()
        data_ret[sheet] = row_list

    return data_ret, "ok", num_right, num_wrong


def student_export_from_db(file_path, sheet_name, cols_wanted=None):
    columns = ['sno', 'school_no', 'school_name', 'consult_no', 'name',
               'rem_code', 'gender', 'degree', 'birthday', 'register_day',
               'information_source', 'counselor', 'reading_school', 'grade', 'phone',
               'tel', 'address', 'zipcode', 'email', 'qq',
               'wechat', 'mother_name', 'mother_phone', 'mother_tel', 'mother_company',
               'father_name', 'father_phone', 'father_tel', 'father_company', 'card',
               'is_training', 'points', 'remark', 'recorder']

    cols_cn = ['学号', '分校编号', '分校名称', '咨询编号', '姓名',
               '助记码', '性别', '文化程度', '出生日期', '登记日期',
               '信息来源', '咨询师', '所在学校', '年级', '本人手机',
               '固定电话', '联系地址', '邮政编码', 'Email', 'QQ',
               '微信标识', '母亲姓名', '母亲手机', '母亲固话', '母亲工作单位',
               '父亲姓名', '父亲手机', '父亲固话', '父亲工作单位', '卡号',
               '是否在读', '赠送积分', '备注', '录入员']
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

    records = DanceStudent.query.all()
    row_count = len(records)
    col_count = len(cols_num)
    for row in range(0, row_count):
        for col in range(0, col_count):
            if row == 0:
                sheet.write(row, col, cols_cn[cols_num[col]], style)
            else:
                sheet.write(row, col, records[row].getval(columns[cols_num[col]]), style)

    wb.save(file_path)
    return 0, 'ok'
