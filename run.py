#!flask/bin/python
# -*- coding:utf-8 -*-
from app import app
from app.tools.getip import get_ip
import sys


if __name__ == '__main__':
    reload(sys)
    sys.setdefaultencoding('utf8')

    ip = get_ip()
    # app.run(host=ip, port=80, debug=True, use_reloader=False, threaded=True)
    app.run(host=ip, port=8081, debug=True, threaded=True)
