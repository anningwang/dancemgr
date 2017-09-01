# -*- coding:utf-8 -*-
import time
from datetime import datetime


def get_filename(sheet_name):
    time1 = datetime.today()
    time_tick = time.time()
    time1_str = datetime.strftime(time1, '_%Y-%m-%d_%H-%M-%S_')
    return sheet_name + time1_str + str(time_tick) + '.xls'
