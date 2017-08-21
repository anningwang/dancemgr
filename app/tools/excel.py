# -*- coding:utf-8 -*-
import xlrd                 # 读取 Excel 模块
from pyExcelerator import *     # 写入Excel 模块


def read_excel(fn):
    workbook = xlrd.open_workbook(fn)
    sheet_range = range(workbook.nsheets)

    worksheets = workbook.sheet_names()
    # print worksheets

    data_ret = {}
    for sheet in worksheets:
        sh = workbook.sheet_by_name(sheet)      # workbook.sheet_by_index()
        row = sh.nrows
        col = sh.ncols
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


import xlwt

if __name__ == '__main__':

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
    col_count = len(datas[0])
    for row in range(0, row_count):
        col_count = len(datas[row])
        for col in range(0, col_count):
            if row == 0:  # 设置表头单元格的格式
                sheet.write(row, col, datas[row][col], header_style)
            else:
                sheet.write(row, col, datas[row][col])
    wb.save(file_path)