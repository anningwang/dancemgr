# -*- coding:utf-8 -*-
from hashlib import md5
from app import db
from app import app
import flask_whooshalchemy as whooshalchemy
import re
import datetime

ROLE_USER = 0
ROLE_ADMIN = 1

GENDER_MALE = '男'
GENDER_FEMALE = '女'

followers = db.Table('followers',
                     db.Column('follower_id', db.Integer, db.ForeignKey('user.id')),
                     db.Column('followed_id', db.Integer, db.ForeignKey('user.id'))
                     )


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nickname = db.Column(db.String(64), unique=True)
    email = db.Column(db.String(120), index=True, unique=True)
    role = db.Column(db.SmallInteger, default=ROLE_USER)
    posts = db.relationship('Post', backref='author', lazy='dynamic')
    about_me = db.Column(db.String(140))
    last_seen = db.Column(db.DateTime)
    followed = db.relationship('User',
                               secondary=followers,
                               primaryjoin=(followers.c.follower_id == id),
                               secondaryjoin=(followers.c.followed_id == id),
                               backref=db.backref('followers', lazy='dynamic'),
                               lazy='dynamic')

    @staticmethod
    def make_valid_nickname(nickname):
        return re.sub('[^a-zA-Z0-9_\.]', '', nickname)

    @staticmethod
    def make_unique_nickname(nickname):
        if User.query.filter_by(nickname=nickname).first() is None:
            return nickname
        version = 2
        while True:
            new_nickname = nickname + str(version)
            if User.query.filter_by(nickname=new_nickname).first() is None:
                break
            version += 1
        return new_nickname
        
    def is_authenticated(self):
        return True

    def is_active(self):
        return True

    def is_anonymous(self):
        return False

    def get_id(self):
        return unicode(self.id)

    def avatar(self, size):
        return 'http://cn.gravatar.com/avatar/' + md5(self.email).hexdigest() + '?d=mm&s=' + str(size)
        # http://www.gravatar.com/avatar/
        
    def follow(self, user):
        if not self.is_following(user):
            self.followed.append(user)
            return self
            
    def unfollow(self, user):
        if self.is_following(user):
            self.followed.remove(user)
            return self
            
    def is_following(self, user):
        return self.followed.filter(followers.c.followed_id == user.id).count() > 0

    def followed_posts(self):
        return Post.query.join(followers, (followers.c.followed_id == Post.user_id)).filter(
            followers.c.follower_id == self.id).order_by(Post.timestamp.desc())

    def __repr__(self):     # pragma: no cover
        return '<User %r>' % self.nickname


class Post(db.Model):
    __searchable__ = ['body']
    
    id = db.Column(db.Integer, primary_key=True)
    body = db.Column(db.String(140))
    timestamp = db.Column(db.DateTime)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    language = db.Column(db.String(5))
    
    def __repr__(self):     # pragma: no cover
        return '<Post %r>' % self.body


class HzToken(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    license = db.Column(db.String(140))
    token = db.Column(db.String(140))
    refresh_token = db.Column(db.String(140))
    expires_in = db.Column(db.Integer)
    timestamp = db.Column(db.DateTime)

    def __repr__(self):
        return '<HzToken %r>' % self.token


class HzLocation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    build_id = db.Column(db.String(40))
    floor_no = db.Column(db.String(40))
    user_id = db.Column(db.String(40))
    x = db.Column(db.Float)
    y = db.Column(db.Float)
    timestamp = db.Column(db.DateTime)

    def __repr__(self):
        return '<HzLocation %r>' % self.user_id


class DanceStudent(db.Model):
    """
    学员表 -- WXG
    """
    id = db.Column(db.Integer, primary_key=True)            # 自动编号，主键  唯一///
    sno = db.Column(db.String(30), unique=True)             # 学号        不可重复 唯一///
    school_no = db.Column(db.String(20))                    # 分校编号
    school_name = db.Column(db.String(40))  # 分校名称
    consult_no = db.Column(db.String(30))   # 咨询编号
    name = db.Column(db.String(40))         # 姓名
    rem_code = db.Column(db.String(40))     # 助记码
    gender = db.Column(db.String(4))          # 性别：男/女
    degree = db.Column(db.String(40))       # 文化程度
    birthday = db.Column(db.String(10))       # 出生日期
    register_day = db.Column(db.DateTime)   # 登记日期
    information_source = db.Column(db.String(40))           # 信息来源
    counselor = db.Column(db.String(20))    # 咨询师
    reading_school = db.Column(db.String(40))  # 所在学校
    grade = db.Column(db.String(20))        # 年级
    phone = db.Column(db.String(20))           # 手机号码  不可重复 唯一///
    tel = db.Column(db.String(20))          # 固定电话  ***保留
    address = db.Column(db.String(60))      # 联系地址
    zipcode = db.Column(db.String(10))      # 邮政编码  ***保留
    email = db.Column(db.String(30))            # email  不可重复 唯一///
    qq = db.Column(db.String(20))           # qq
    wechat = db.Column(db.String(60))       # 微信标识  ***保留
    mother_name = db.Column(db.String(14))  # 母亲姓名
    father_name = db.Column(db.String(14))  # 父亲姓名
    mother_phone = db.Column(db.String(20))     # 母亲手机
    father_phone = db.Column(db.String(20))     # 父亲手机
    mother_tel = db.Column(db.String(20))   # 母亲固话  ***保留
    father_tel = db.Column(db.String(20))   # 父亲固话  ***保留
    mother_company = db.Column(db.String(40))  # 母亲单位
    father_company = db.Column(db.String(40))  # 父亲单位
    card = db.Column(db.String(40))         # 卡号  ***保留
    is_training = db.Column(db.String(4))     # 是否在读 是/否 （在本培训中心）
    points = db.Column(db.Integer)          # 赠送积分  ***保留
    remark = db.Column(db.String(140))      # 备注
    recorder = db.Column(db.String(14))     # 录入员

    def __init__(self, name, sno, school_no, school_name,
                 consult_no, rem_code, gender, degree, birthday, register_day,
                 recorder,
                 information_source, counselor, reading_school, grade,
                 phone, address, email, qq,
                 mother_name, mother_phone, mother_company,
                 father_name, father_phone, father_company,
                 tel=None, zipcode=None, wechat=None,
                 mother_tel=None, father_tel=None,
                 card=None, is_training=None,
                 points=None, remark=None):
        self.name = name
        self.sno = sno
        self.school_no = school_no
        self.school_name = school_name
        self.consult_no = consult_no
        self.rem_code = rem_code
        self.gender = gender
        self.degree = degree
        self.birthday = birthday
        self.register_day = register_day
        self.information_source = information_source
        self.counselor = counselor
        self.reading_school = reading_school
        self.grade = grade
        self.phone = phone

        if tel is None:
            tel = ''
        self.tel = tel

        self.address = address

        if zipcode is None:
            zipcode = ''
        self.zipcode = zipcode

        self.email = email
        self.qq = qq

        if wechat is None:
            wechat = ''
        self.wechat = wechat

        self.mother_name = mother_name
        self.mother_phone = mother_phone

        if mother_tel is None:
            mother_tel = ''
        self.mother_tel = mother_tel

        self.mother_company = mother_company
        self.father_name = father_name
        self.father_phone = father_phone

        if father_tel is None:
            father_tel = ''
        self.father_tel = father_tel
        self.father_company = father_company

        if card is None:
            card = ''
        self.card = card

        if is_training is None:
            is_training = True
        self.is_training = is_training

        if points is None:
            points = 0
        self.points = points

        if remark is None:
            remark = ''
        self.remark = remark
        self.recorder = recorder

    def __init__(self, para):
        if u'sno' in para:
            self.sno = para[u'sno']
        if u'school_no' in para:
            self.school_no = para[u'school_no']
        if u'school_name' in para:
            self.school_name = para[u'school_name']
        if u'consult_no' in para:
            self.consult_no = para[u'consult_no']
        if u'name' in para:
            self.name = para[u'name']
        if u'rem_code' in para:
            self.rem_code = para[u'rem_code']
        if u'gender' in para:
            self.gender = para[u'gender']
        if u'degree' in para:
            self.degree = para[u'degree']
        if u'birthday' in para:
            self.birthday = para[u'birthday']
        if u'register_day' in para:
            reg_day = para[u'register_day']
            self.register_day = datetime.datetime.strptime(reg_day, '%Y-%m-%d')
        if u'information_source' in para:
            self.information_source = para[u'information_source']
        if u'counselor' in para:
            self.counselor = para[u'counselor']
        if u'reading_school' in para:
            self.reading_school = para[u'reading_school']
        if u'grade' in para:
            self.grade = para[u'grade']
        if u'phone' in para:
            self.phone = para[u'phone']
        if u'tel' in para:
            self.tel = para[u'tel']
        if u'address' in para:
            self.address = para[u'address']
        if u'zipcode' in para:
            self.zipcode = para[u'zipcode']
        if 'email' in para:
            self.email = para[u'email']
        if u'qq' in para:
            self.qq = para[u'qq']
        if u'wechat' in para:
            self.wechat = para[u'wechat']
        if 'mother_name' in para:
            self.mother_name = para[u'mother_name']
        if u'father_name' in para:
            self.father_name = para[u'father_name']
        if u'mother_phone' in para:
            self.mother_phone = para[u'mother_phone']
        if u'father_phone' in para:
            self.father_phone = para[u'father_phone']
        if u'mother_tel' in para:
            self.mother_tel = para[u'mother_tel']
        if u'father_tel' in para:
            self.father_tel = para[u'father_tel']
        if u'mother_company' in para:
            self.mother_company = para[u'mother_company']
        if u'father_company' in para:
            self.father_company = para[u'father_company']
        if u'card' in para:
            self.card = para[u'card']
        if u'is_training' in para:
            self.is_training = para[u'is_training']

        if u'points' in para:
            self.points = int(para[u'points'])
        if u'remark' in para:
            self.remark = para[u'remark']
        if u'recorder' in para:
            self.recorder = para[u'recorder']

    def __repr__(self):
        return '<DanceStudent %r>' % self.sno

whooshalchemy.whoosh_index(app, Post)
