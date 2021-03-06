# -*- coding:utf-8 -*-
import time
import datetime
import calendar


def get_filename(sheet_name):
    time1 = datetime.datetime.today()
    time_tick = time.time()
    time1_str = datetime.datetime.strftime(time1, '_%Y-%m-%d_%H-%M-%S_')
    return sheet_name + time1_str + str(time_tick) + '.xls'


def dc_gen_code(school_no, tag, date=None):
    """
    生产单据编号，包括学号，班级编号，收费单号等。
    :param school_no:       分校编号，例如：0001,0002
    :param tag:             单据标识，例如学号为 XH， 收费单为 SFD
    :param date:            日期，单据上附加日期信息
    :return:        生成的编号
    """
    if date is None:
        date = datetime.datetime.today()
    data_str = datetime.datetime.strftime(date, '%y%m%d-')
    code_str = '%04d-%s-%s' % (int(school_no), tag, data_str)
    return code_str


def gen_code(tag, date=None):
    """
    生产单据编号，包括学号，班级编号，收费单号等。
    :param tag:             单据标识，例如学号为 XH， 收费单为 SFD
    :param date:            日期，单据上附加日期信息
    :return:        生成的编号
    """
    if date is None:
        date = datetime.datetime.today()
    data_str = datetime.datetime.strftime(date, '%y%m%d-')
    code_str = '%s-%s' % (tag, data_str)
    return code_str


def utc2local(utc_st):
    """
    UTC时间转本地时间（+8:00）
    :param utc_st:          utc datetime
    :return:                local datetime
    """
    now_stamp = time.time()
    local_time = datetime.datetime.fromtimestamp(now_stamp)
    utc_time = datetime.datetime.utcfromtimestamp(now_stamp)
    offset = local_time - utc_time
    local_st = utc_st + offset
    return local_st


def local2utc(local_st):
    """
    本地时间转UTC时间（-8:00）
    :param local_st:        local datetime
    :return:                utc datetime
    """
    time_struct = time.mktime(local_st.timetuple())
    utc_st = datetime.datetime.utcfromtimestamp(time_struct)
    return utc_st


def dc_records_changed(old, new, field):
    """
    用于增量修改记录。判断在原纪录基础上的删、改、增情况。
       var aa = [{id: 1, name:'Tom'},{id:2, name:'Peter'}]; 原始记录
       var bb = [{name:'Alice'}, {id:2, name: 'PP'}];       最终记录。
       var chg = dcRecordsChanged(aa, bb, 'id')
       则需要增加bb中的第一条，修改为bb中第二条，删除aa中第一个条。
       返回值为 {add:[0], del:[0], upd:[1]}
    :param old:     原始记录 [{}, {}]
    :param new:     修改后的记录  [ {}, {}]
    :param field:   比较字段，用于判断增、改、删
    :return:    {'add': list, 'del': list, 'upd': list}
    """
    add_idx = []
    del_idx = []
    upd_idx = []
    ori = []
    cur = []

    for i in old:
        if field in i:
            ori.append(i[field])
    for i in range(len(new)):
        if field in new[i]:
            cur.append(new[i][field])
        else:
            add_idx.append(i)
    del_key = list(set(ori).difference(set(cur)))
    upd_key = list(set(ori).intersection(set(cur)))
    for j in range(len(del_key)):
        for i in range(len(old)):
            if field in old[i] and old[i][field] == del_key[j]:
                del_idx.append(i)
                break
    for j in range(len(upd_key)):
        for i in range(len(new)):
            if field in new[i] and new[i][field] == upd_key[j]:
                upd_idx.append(i)
                break

    return {'add': add_idx, 'del': del_idx, 'upd': upd_idx}


def is_float(val):
    try:
        float(val)
        return True
    except ValueError:
        return False


def start_end_time(tm, val):
    one_day = datetime.timedelta(hours=23, minutes=59, seconds=59, microseconds=999999)
    if tm == 'year-month':      # 按照 年 月 查询
        ym = val.split('-')
        year = int(ym[0])
        month = int(ym[1])
        d1 = datetime.datetime(year=year, month=month, day=1)
        month_range = calendar.monthrange(year, month)
        d2 = d1 + datetime.timedelta(days=month_range[1]-1) + one_day
    elif tm == 'today':     # 今天
        td = datetime.date.today()
        d1 = datetime.datetime.strptime(str(td), '%Y-%m-%d')
        d2 = d1 + one_day
    elif tm == 'yesterday':
        td = datetime.date.today()
        d1 = datetime.datetime.strptime(str(td), '%Y-%m-%d') - datetime.timedelta(days=1)
        d2 = d1 + one_day
    elif tm == 'this-week':
        cal = DcCalendar()
        # cal.set_monday_is_first(False)
        d1, d2 = cal.this_week()
    elif tm == 'last-week':
        cal = DcCalendar()
        # cal.set_monday_is_first(False)
        d1, d2 = cal.last_week()
    elif tm == 'this-month':
        cal = DcCalendar()
        d1, d2 = cal.this_month()
    elif tm == 'last-month':
        cal = DcCalendar()
        d1, d2 = cal.last_month()
    else:
        d1 = datetime.datetime.strptime(tm, '%Y-%m-%d')
        d2 = d1 + one_day
    return d1, d2


class DcCalendar(object):
    def __init__(self, date_time=datetime.datetime.today(), monday_is_first=True):
        self.date_time = date_time
        self.date = datetime.datetime.strptime(str(date_time.date()), '%Y-%m-%d')
        self.isoweekday = self.date.isoweekday()
        self.weekday = self.date.weekday()
        self.one_day = datetime.timedelta(hours=23, minutes=59, seconds=59, microseconds=999999)
        self.monday_is_first = monday_is_first

    def last_week(self):
        date_to = self.date - datetime.timedelta(days=self.isoweekday)
        date_from = date_to - datetime.timedelta(days=6)
        date_to += self.one_day
        if self.monday_is_first is False:
            date_from -= datetime.timedelta(days=1)
            date_to -= datetime.timedelta(days=1)
        return date_from, date_to

    def this_week(self):
        date_from = self.date - datetime.timedelta(days=self.isoweekday-1)
        date_to = date_from + self.one_day + datetime.timedelta(days=6)
        if self.monday_is_first is False:
            date_from -= datetime.timedelta(days=1)
            date_to -= datetime.timedelta(days=1)
        return date_from, date_to

    def set_monday_is_first(self, is_first=True):
        self.monday_is_first = is_first

    def this_month(self):
        year = self.date.year
        month = self.date.month
        date_from = datetime.datetime(year, month, 1, 0, 0, 0)
        month_range = calendar.monthrange(year, month)
        date_to = date_from + datetime.timedelta(days=month_range[1] - 1) + self.one_day
        return date_from, date_to

    def last_month(self):
        month = 12 if self.date.month == 1 else self.date.month - 1
        year = self.date.year if month != 12 else self.date.year - 1
        date_from = datetime.datetime(year, month, 1, 0, 0, 0)
        month_range = calendar.monthrange(year, month)
        date_to = date_from + datetime.timedelta(days=month_range[1] - 1) + self.one_day
        return date_from, date_to
