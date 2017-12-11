# -*- coding:utf-8 -*-

import os
from flask import Flask, session
from flask_session import Session
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_openid import OpenID
from flask_mail import Mail
from flask_babel import Babel, lazy_gettext
from config import basedir, ADMINS, MAIL_SERVER, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD, FILENAME_APP_LOG, APP_NAME
from momentjs import momentjs
from datetime import timedelta


# Set this variable to "threading", "eventlet" or "gevent" to test the
# different async modes, or leave it set to None for the application to choose
# the best option based on installed packages.
async_mode = None

app = Flask(__name__)
app.config.from_object('config')

db = SQLAlchemy(app)
lm = LoginManager()
lm.login_view = 'login'
lm.login_message = lazy_gettext(u'请登录！')
lm.session_protection = 'strong'
lm.remember_cookie_duration = timedelta(days=1)
lm.init_app(app)

# app.permanent_session_lifetime = timedelta(minutes=5)

oid = OpenID(app, os.path.join(basedir, 'tmp'))
mail = Mail(app)
babel = Babel(app)

if not app.debug:
    import logging
    from logging.handlers import SMTPHandler
    credentials = None
    if MAIL_USERNAME or MAIL_PASSWORD:
        credentials = (MAIL_USERNAME, MAIL_PASSWORD)
    mail_handler = SMTPHandler((MAIL_SERVER, MAIL_PORT), 'no-reply@' + MAIL_SERVER, ADMINS,
                               APP_NAME + ' failure', credentials)
    mail_handler.setLevel(logging.ERROR)
    app.logger.addHandler(mail_handler)

if not app.debug:
    import logging
    from logging.handlers import RotatingFileHandler
    file_handler = RotatingFileHandler(FILENAME_APP_LOG, 'a', 1 * 1024 * 1024, 10)
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'))
    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.INFO)
    app.logger.info(APP_NAME + ' startup')

app.jinja_env.globals['momentjs'] = momentjs


sess = Session()
sess.init_app(app)


@app.route('/set/')
def session_set():
    session['key'] = 'value'
    return 'ok'


@app.route('/get/')
def session_get():
    return session.get('key', 'not set')


from app import views, models, dancedatamgr, dancetree
from tools.upload import *
