# -*- coding: utf8 -*-
import os
basedir = os.path.abspath(os.path.dirname(__file__))

CSRF_ENABLED = True
SECRET_KEY = 'you-will-never-guess-A0Zr98j/3yX R~XHH!jmN]LWX/,?RT'
APP_NAME = 'dancemgr'


SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'app.db')
SQLALCHEMY_MIGRATE_REPO = os.path.join(basedir, 'db_repository')
SQLALCHEMY_RECORD_QUERIES = True
WHOOSH_BASE = os.path.join(basedir, 'search.db')

FILENAME_VERTEX = os.path.join(basedir, "app/static/ajax/vertex.json")
FILENAME_APP_LOG = basedir + '/tmp/' + APP_NAME + '.log'

# slow database query threshold (in seconds)
DATABASE_QUERY_TIMEOUT = 0.5

# email server
MAIL_SERVER = 'your.mailserver.com'
MAIL_PORT = 25
MAIL_USE_TLS = False
MAIL_USE_SSL = False
MAIL_USERNAME = 'you'
MAIL_PASSWORD = 'your-password'

# available languages
LANGUAGES = {
    'en': 'English',
    'es': 'Español'
}

# microsoft translation service
MS_TRANSLATOR_CLIENT_ID = ''        # enter your MS translator app id here
MS_TRANSLATOR_CLIENT_SECRET = ''    # enter your MS translator app secret here

# administrator list
ADMINS = ['you@example.com']

# pagination
POSTS_PER_PAGE = 10
MAX_SEARCH_RESULTS = 50

SQLALCHEMY_TRACK_MODIFICATIONS = True

# initialize Flask-Session
SESSION_TYPE = 'redis'
SESSION_USE_SIGNER = True
SESSION_PERMANENT = True
PERMANENT_SESSION_LIFETIME = 60 * 5    # unit:(s, second)
