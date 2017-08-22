#!flask/bin/python
# -*- coding:utf-8 -*-
from app import app
from app.tools.excel import student_import_to_db

import socket
hostname = socket.gethostname()
ip = socket.gethostbyname(hostname)

my_dict, msg, nr, nw = student_import_to_db(u'D:/师之伴侣数据备份/报名登记_2017-08-21_13-09-34.xls')

# app.run(debug=True)
if __name__ == '__main__':
    # app.run(host=ip, port=80, debug=True, use_reloader=False, threaded=True)
    app.run(host=ip, port=80, debug=True, threaded=True)
