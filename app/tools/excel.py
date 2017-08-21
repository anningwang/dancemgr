# -*- coding:utf-8 -*-
import xlrd                 # 读取 Excel 模块
import xlwt                 # Excel 写模块
from pyExcelerator import *     # 写入Excel 模块
from app import db
from app.models import DanceStudent


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
    '''
    :param fn:   文件名，需要导入数据的Excel文件名
    :return:     读取的 Excel 数据
    '''
    workbook = xlrd.open_workbook(fn)
    worksheets = workbook.sheet_names()
    columns = ['sno', 'school_no', 'school_name', 'consult_no', 'name', 'rem_code', 'gender', 'degree',
               'birthday', 'register_day', 'information_source', 'counselor', 'reading_school',
               'grade', 'phone', 'tel', 'address', 'zipcode', 'email', 'qq',
               'wechat', 'mother_name', 'mother_phone', 'mother_tel', 'mother_company',
               'father_name', 'father_phone', 'father_tel', 'father_company',
               'card', 'is_training', 'points', 'remark', 'recorder']
    data_ret = {}
    for sheet in worksheets:
        if sheet != u'报名登记':
            continue
        sh = workbook.sheet_by_name(sheet)      # workbook.sheet_by_index()
        row = sh.nrows
        row_list = [sh.row_values(0)]
        for rows in range(1, row):
            row_data = sh.row_values(rows)
            row_list.append(row_data)           # sh.cell_value(0, 0), 获取第0行第0列数据
            rowdict = {}
            '''
            for rd in rows:
                if rd == '学号':
                    rowdict['sno'] = rd
                elif rd == '分校编号':
                    rowdict['school_no'] = rd
                elif rd == '分校名称':
                    rowdict['school_name'] = rd
                elif rd == '咨询编号'
           '''
            if len(row_data) < len(columns):
                return data_ret, "数据长度错误"

            for i in range(len(columns)):
                rowdict[columns[i]] = row_data[i]
            tb = DanceStudent(rowdict)
            db.session.add(tb)

        db.session.commit()
        data_ret[sheet] = row_list

    return data_ret, "ok"
