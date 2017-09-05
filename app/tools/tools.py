# -*- coding:utf-8 -*-
import time
from datetime import datetime


def get_filename(sheet_name):
    time1 = datetime.today()
    time_tick = time.time()
    time1_str = datetime.strftime(time1, '_%Y-%m-%d_%H-%M-%S_')
    return sheet_name + time1_str + str(time_tick) + '.xls'


def utc2local(utc_st):
    """
    UTC时间转本地时间（+8:00）
    :param utc_st:          utc datetime
    :return:                local datetime
    """
    now_stamp = time.time()
    local_time = datetime.fromtimestamp(now_stamp)
    utc_time = datetime.utcfromtimestamp(now_stamp)
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
    utc_st = datetime.utcfromtimestamp(time_struct)
    return utc_st
