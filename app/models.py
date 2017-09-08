# -*- coding:utf-8 -*-
from hashlib import md5
from app import db
from app import app
from flask_login import UserMixin
import flask_whooshalchemy as whooshalchemy
import re
import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from tools.tools import get_stu_no
from flask import g

ROLE_USER = 0
ROLE_ADMIN = 1

GENDER_MALE = '男'
GENDER_FEMALE = '女'

'''
DanceUserSchool = db.Table('dance_user_school',
                           db.Column('user_id', db.Integer, db.ForeignKey('dance_user.id')),
                           db.Column('school_id', db.Integer, db.ForeignKey('dance_school.id'))
                           )
'''

followers = db.Table('followers',
                     db.Column('follower_id', db.Integer, db.ForeignKey('user.id')),
                     db.Column('followed_id', db.Integer, db.ForeignKey('user.id'))
                     )


class DanceUserSchool(db.Model):
    __tablename__ = 'dance_user_school'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('dance_user.id'))
    school_id = db.Column(db.Integer, db.ForeignKey('dance_school.id'))


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
    学员表 -- Anningwang
    """
    # __bind_key__ = 'dance_student'
    id = db.Column(db.Integer, primary_key=True)            # 自动编号，主键  唯一///        01
    sno = db.Column(db.String(30))             # 学号        不可重复 唯一///   02
    school_no = db.Column(db.String(20))                    # 分校编号      03
    school_name = db.Column(db.String(40))  # 分校名称      04
    consult_no = db.Column(db.String(30))   # 咨询编号      05
    name = db.Column(db.String(40, collation='NOCASE'))        # 姓名            06
    rem_code = db.Column(db.String(40))     # 助记码           07
    gender = db.Column(db.String(4))          # 性别：男/女      08
    degree = db.Column(db.String(40))       # 文化程度          09
    birthday = db.Column(db.String(10))       # 出生日期        10
    register_day = db.Column(db.DateTime)   # 登记日期          11
    information_source = db.Column(db.String(40))           # 信息来源  12
    counselor = db.Column(db.String(20))    # 咨询师       13
    reading_school = db.Column(db.String(40))  # 所在学校       14
    grade = db.Column(db.String(20))        # 年级            15
    phone = db.Column(db.String(20))           # 手机号码  不可重复 唯一///   16
    tel = db.Column(db.String(20))          # 固定电话  ***保留       17
    address = db.Column(db.String(60))      # 联系地址          18
    zipcode = db.Column(db.String(10))      # 邮政编码  ***保留       19
    email = db.Column(db.String(30))            # email  不可重复 唯一///     20
    qq = db.Column(db.String(20))           # qq        21
    wechat = db.Column(db.String(60))       # 微信标识  ***保留       22
    mother_name = db.Column(db.String(14))  # 母亲姓名      23
    father_name = db.Column(db.String(14))  # 父亲姓名      24
    mother_phone = db.Column(db.String(20))     # 母亲手机      25
    father_phone = db.Column(db.String(20))     # 父亲手机      26
    mother_tel = db.Column(db.String(20))   # 母亲固话  ***保留       27
    father_tel = db.Column(db.String(20))   # 父亲固话  ***保留       28
    mother_company = db.Column(db.String(40))  # 母亲单位           29
    father_company = db.Column(db.String(40))  # 父亲单位           30
    card = db.Column(db.String(40))         # 卡号  ***保留         31
    is_training = db.Column(db.String(4))     # 是否在读 是/否 （在本培训中心）       32
    points = db.Column(db.Integer)          # 赠送积分  ***保留       33
    remark = db.Column(db.String(140))      # 备注            34
    recorder = db.Column(db.String(14))     # 录入员          35
    idcard = db.Column(db.String(30))           # 身份证号       36
    mother_wechat = db.Column(db.String(60))    # 微信标识  ***保留       37
    father_wechat = db.Column(db.String(60))    # 微信标识  ***保留       38
    school_id = db.Column(db.Integer, db.ForeignKey('dance_school.id'))

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
                 points=None, remark=None,
                 idcard=None, mother_wechat=None, father_wechat=None
                 ):
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
        self.recorder = g.user.name if recorder is None else recorder

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
            self.register_day = datetime.datetime.strptime(para[u'register_day'], '%Y-%m-%d')
            if self.register_day.date() == datetime.date.today():
                self.register_day = datetime.datetime.today()
        else:
            self.register_day = datetime.datetime.today()
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
        self.recorder = para[u'recorder'] if u'recorder' in para else g.user.name

        if 'idcard' in para:
            self.idcard = para['idcard']
        if 'mother_wechat' in para:
            self.mother_wechat = para['mother_wechat']
        if 'father_wechat' in para:
            self.father_wechat = para['father_wechat']

    def getval(self, col_name):
        if col_name == 'id':
            return self.id
        elif col_name == 'sno':
            return self.sno
        elif col_name == 'school_no':
            return self.school_no
        elif col_name == 'school_name':
            return self.school_name
        elif col_name == 'consult_no':
            return self.consult_no
        elif col_name == 'name':
            return self.name
        elif col_name == 'rem_code':
            return self.rem_code
        elif col_name == 'gender':
            return self.gender
        elif col_name == 'degree':
            return self.degree
        elif col_name == 'birthday':
            return self.birthday
        elif col_name == 'register_day':
            return datetime.datetime.strftime(self.register_day, '%Y-%m-%d')
        elif col_name == 'information_source':
            return self.information_source
        elif col_name == 'counselor':
            return self.counselor
        elif col_name == 'reading_school':
            return self.reading_school
        elif col_name == 'grade':
            return self.grade
        elif col_name == 'phone':
            return self.phone
        elif col_name == 'tel':
            return self.tel
        elif col_name == 'address':
            return self.address
        elif col_name == 'zipcode':
            return self.zipcode
        elif col_name == 'email':
            return self.email
        elif col_name == 'qq':
            return self.qq
        elif col_name == 'wechat':
            return self.wechat
        elif col_name == 'mother_name':
            return self.mother_name
        elif col_name == 'father_name':
            return self.father_name
        elif col_name == 'mother_phone':
            return self.mother_phone
        elif col_name == 'father_phone':
            return self.father_phone
        elif col_name == 'mother_tel':
            return self.mother_tel
        elif col_name == 'father_tel':
            return self.father_tel
        elif col_name == 'mother_company':
            return self.mother_company
        elif col_name == 'father_company':
            return self.father_company
        elif col_name == 'card':
            return self.card
        elif col_name == 'is_training':
            return self.is_training
        elif col_name == 'points':
            return self.points
        elif col_name == 'remark':
            return self.remark
        elif col_name == 'recorder':
            return self.recorder
        elif col_name == 'idcard':
            return self.idcard
        elif col_name == 'mother_wechat':
            return self.mother_wechat
        elif col_name == 'father_wechat':
            return self.father_wechat
        else:
            return '<Unknown field name>'

    def create_sno(self):
        search_sno = get_stu_no(self.school_no)
        stu = DanceStudent.query.filter(DanceStudent.sno.like(
            '%' + search_sno + '%')).order_by(DanceStudent.id.desc()).first()
        number = 1 if stu is None else int(stu.sno.rsplit('-', 1)[1]) + 1
        self.sno = search_sno + ('%03d' % number)
        return self.sno

    def __repr__(self):
        return '<DanceStudent %r>' % self.sno


class DanceClass(db.Model):
    """
    班级表 -- Anningwang
    """
    # __bind_key__ = 'dance_class'
    id = db.Column(db.Integer, primary_key=True)    # id                01
    cno = db.Column(db.String(20))     # 班级编号          02
    school_no = db.Column(db.String(20))            # 分校编号          03
    school_name = db.Column(db.String(40))          # 分校名称          04
    class_name = db.Column(db.String(40, collation='NOCASE'))           # 班级名称          05
    rem_code = db.Column(db.String(40, collation='NOCASE'))             # 助记码            06
    begin_year = db.Column(db.String(6))    # 开班年份      07
    class_type = db.Column(db.String(20))   # 班级类型， 教授类别： 舞蹈、美术、跆拳道、国际象棋等   08
    class_style = db.Column(db.String(20))  # 班级形式： 集体课, 1对1      09
    teacher = db.Column(db.String(20))      # 授课老师姓名        10
    cost_mode = db.Column(db.String(20))    # 收费模式            11
    cost = db.Column(db.Integer)            # 收费标准            12
    plan_students = db.Column(db.Integer)   # 计划招收人数        13
    cur_students = db.Column(db.Integer)    # 当前人数            14
    is_ended = db.Column(db.Integer)        # 是否结束      1 -- 结束； 0 -- 未结束       15
    remark = db.Column(db.String(140))      # 备注         16
    recorder = db.Column(db.String(20))     # 录入员       17
    school_id = db.Column(db.Integer, db.ForeignKey('dance_school.id'))

    def __init__(self, para):
        if 'cno' in para:
            self.cno = para['cno']              # 02
        if 'school_no' in para:
            self.school_no = para['school_no']         # 03
        if 'school_name' in para:
            self.school_name = para['school_name']      # 04
        if 'class_name' in para:
            self.class_name = para['class_name']        # 班级名称          05
        if 'rem_code' in para:
            self.rem_code = para['rem_code']        # 助记码            06
        if 'begin_year' in para:
            self.begin_year = para['begin_year']        # 开班年份      07
        if 'class_type' in para:
            self.class_type = para['class_type']        # 班级类型， 教授类别： 舞蹈、美术、跆拳道、国际象棋等   08
        if 'class_style' in para:
            self.class_style = para['class_style']      # 班级形式： 集体课, 1对1      09
        if 'teacher' in para:
            self.teacher = para['teacher']              # 授课老师姓名        10
        if 'cost_mode' in para:
            self.cost_mode = para['cost_mode']          # 收费模式            11
        if 'cost' in para:
            self.cost = para['cost']                    # 收费标准            12
        if 'plan_students' in para:
            self.plan_students = para['plan_students']      # 计划招收人数        13
        if 'cur_students' in para:
            self.cur_students = para['cur_students']        # 当前人数            14
        if 'is_ended' in para:
            self.is_ended = para['is_ended']            # 是否结束      1 -- 结束； 0 -- 未结束       15
        if 'remark' in para:
            self.remark = para['remark']            # 备注         16
        if 'recorder' in para:
            self.recorder = para['recorder']        # 录入员       17
        if 'school_id' in para:
            self.school_id = int(para['school_id'])

    def __repr__(self):
        return '<DanceClass %r>' % self.cno


class DanceSchool(db.Model):
    """
    分校信息表 -- Anningwang
    """
    __tablename__ = 'dance_school'
    id = db.Column(db.Integer, primary_key=True)    # id                01
    school_no = db.Column(db.String(20, collation='NOCASE'))            # 分校编号          02
    school_name = db.Column(db.String(40, collation='NOCASE'))          # 分校名称          03
    address = db.Column(db.String(80))              # 分校地址          04
    rem_code = db.Column(db.String(40, collation='NOCASE'))             # 助记码            05
    zipcode = db.Column(db.String(10))              # 邮政编码          06
    manager = db.Column(db.String(20))              # 负责人姓名        07
    tel = db.Column(db.String(20))                  # 分校联系电话      08
    manager_phone = db.Column(db.String(20))        # 负责人手机        09
    remark = db.Column(db.String(140))              # 备注              10
    recorder = db.Column(db.String(20))             # 录入员            11
    company_id = db.Column(db.Integer, db.ForeignKey('dance_company.id'))

    def __init__(self, para):
        if 'school_no' in para:
            self.school_no = para['school_no']         # 分校编号          02
        if 'school_name' in para:
            self.school_name = para['school_name']      # 分校名称          03
        if 'address' in para:
            self.address = para['address']        # 分校地址          04
        if 'rem_code' in para:
            self.rem_code = para['rem_code']        # 助记码            05
        if 'zipcode' in para:
            self.zipcode = para['zipcode']  # 邮政编码          06
        if 'manager' in para:
            self.manager = para['manager']  # 负责人姓名        07
        if 'tel' in para:
            self.class_style = para['tel']  # 分校联系电话      08
        if 'manager_phone' in para:
            self.manager_phone = para['manager_phone']  # 负责人手机        09
        if 'remark' in para:
            self.remark = para['remark']  # 备注         10
        self.recorder = g.user.name if 'recorder' not in para else para['recorder']
        self.company_id = int(para['company_id']) if 'company_id' in para else g.user.company_id

    def save(self):
        db.session.add(self)
        db.session.commit()
        return self

    def update(self):
        db.session.commit()
        return self

    def update_data(self, para):
        if 'school_no' in para:
            self.school_no = para['school_no']         # 分校编号
        if 'school_name' in para:
            self.school_name = para['school_name']      # 分校名称
        if 'address' in para:
            self.address = para['address']        # 分校地址
        if 'rem_code' in para:
            self.rem_code = para['rem_code']        # 助记码
        if 'zipcode' in para:
            self.zipcode = para['zipcode']  # 邮政编码
        if 'manager' in para:
            self.manager = para['manager']  # 负责人姓名
        if 'tel' in para:
            self.class_style = para['tel']  # 分校联系电话
        if 'manager_phone' in para:
            self.manager_phone = para['manager_phone']  # 负责人手机
        if 'remark' in para:
            self.remark = para['remark']  # 备注
        if 'recorder' in para:
            self.recorder = para['recorder']  # 录入员
        if 'company_id' in para:
            self.company_id = int(para['company_id'])

    @staticmethod
    def get_school_id(school_name):
        school = DanceSchool.query.filter(DanceSchool.school_name == school_name,
                                          DanceSchool.company_id == g.user.company_id).first()
        return -1 if school is None else school.id

    @staticmethod
    def get_school_id_list():
        schools = DanceSchool.query.filter(DanceSchool.company_id == g.user.company_id).all()
        school_list = {}
        for sc in schools:
            school_list[sc.school_name.lower()] = sc.id
        return school_list

    def __repr__(self):
        return '<DanceClass %r>' % self.school_no


class DanceUser(db.Model, UserMixin):
    """
        用户基本信息表 -- Anningwang
    """
    id = db.Column(db.Integer, primary_key=True)
    user_no = db.Column(db.String(10, collation='NOCASE'), index=True)   # 用户编号
    name = db.Column(db.String(40, collation='NOCASE'), index=True)    # 用户名称
    pwd = db.Column(db.String(256))                 # 用户密码
    phone = db.Column(db.String(20))                # 联系电话
    role_id = db.Column(db.Integer)                 # 所属角色
    recorder = db.Column(db.String(20, collation='NOCASE'))      # 录入员
    email = db.Column(db.String(30, collation='NOCASE'), unique=True, index=True)
    company_id = db.Column(db.Integer, db.ForeignKey('dance_company.id'))
    is_logged = db.Column(db.Integer, index=True)   # 登录状态 1 - 登录， 0 - 未登录
    is_creator = db.Column(db.Integer, index=True)  # 是否创始人 1 - 是创始人， 0 - 不是创始人
    create_at = db.Column(db.DateTime)

    def __init__(self, para):
        if 'user_no' in para:
            self.user_no = para['user_no']   # 用户编号 02
        else:
            self.create_user_no()

        if 'name' in para:
            self.name = para['name']        # 用户名称 03
        else:
            raise Exception(u'[name] field not found!')
        if 'pwd' in para:
            self.pwd = generate_password_hash(para['pwd'])          # 用户密码 04
        else:
            raise Exception(u'[pwd] field not found!')
        if 'phone' in para:
            self.phone = para['phone']      # 联系电话 05
        self.role_id = ROLE_USER if 'role_id' not in para or para['role_id'] != ROLE_ADMIN else ROLE_ADMIN      # #################### role_id not ROLE_USER， ROLE_ADMIN
        self.recorder = g.user.name if g.user.is_authenticated else u'[系统]'
        if 'email' in para:
            self.email = para['email']
        if 'company_id' in para:
            self.company_id = para['company_id']
        elif g.user.is_authenticated:
            self.company_id = g.user.company_id
        else:
            raise Exception(u'[company_id] field not found!')
        self.is_logged = 0
        self.is_creator = 0 if 'is_creator' not in para or para['is_creator'] != 1 else 1
        self.create_at = datetime.datetime.today()

    def create_user_no(self):
        if g.user.is_authenticated:
            rec = DanceUser.query.filter_by(company_id=g.user.company_id).order_by(
                DanceUser.user_no.desc()).first()
            self.user_no = 1 if rec is None else int(rec.user_no) + 1
        else:
            self.user_no = 1
        return self.user_no

    def update_data(self, para):
        if 'user_no' in para:
            self.user_no = para['user_no']  # 用户编号 02
        if 'name' in para:
            self.name = para['name']        # 用户名称 03
        if 'pwd' in para:
            self.pwd = para['pwd']          # 用户密码 04
        if 'phone' in para:
            self.phone = para['phone']      # 联系电话 05
        if 'role' in para:
            self.role_id = para['role_id']        # 所属角色 06
        if 'recorder' in para:
            self.recorder = para['recorder']    # 录入员 08
        self.is_logged = 0 if 'is_logged' not in para else para['is_logged']

    def check_logged(self):
        return True if self.is_logged == 1 else False

    def login(self):
        self.is_logged = 1
        db.session.commit()
        return self

    def logout(self):
        self.is_logged = 0
        db.session.commit()
        return self

    def check_password(self, password):
        return check_password_hash(self.pwd, password)

    def add_relationship2school(self, school_id):
        if school_id == '':
            return self
        if DanceUserSchool.query.filter_by(user_id=self.id).filter_by(school_id=int(school_id)).first() is not None:
            return self
        user_school = DanceUserSchool(user_id=self.id, school_id=int(school_id))
        db.session.add(user_school)
        return self

    def del_user(self):
        user_schools = DanceUserSchool.query.filter_by(user_id=self.id).all()
        for us in user_schools:
            db.session.delete(us)

    def update_relationship2school(self, data):
        if g.user.id == self.id:
            return self
        # 全量更新关联关系。 若 school_ids为空，表示删除之前的所有关联。 即，以school_ids中的关系为最终结果。
        if 'school_id' not in data:
            return self
        school_ids = data['school_id'].split(',')
        old_ids = []
        user_schools = DanceUserSchool.query.filter_by(user_id=self.id).all()
        for us in user_schools:
            old_ids.append(str(us.school_id))
        to_add = list(set(school_ids).difference(set(old_ids)))
        to_del = list(set(old_ids).difference(set(school_ids)))
        for add_id in to_add:
            self.add_relationship2school(add_id)
        for del_id in to_del:
            tmp = DanceUserSchool.query.filter(DanceUserSchool.school_id == int(del_id),
                                               DanceUserSchool.user_id == self.id).all()
            for tt in tmp:
                db.session.delete(tt)
        return self

    def __repr__(self):
        return '<DanceUser %r>' % self.user_no


class DanceStudentClass(db.Model):
    # 学生报班信息表 多 对 多。 同时可以看到 某个班级 有多少学生。
    id = db.Column(db.Integer, primary_key=True)  # id  01
    student_id = db.Column(db.Integer, db.ForeignKey('dance_student.id'))
    class_id = db.Column(db.Integer, db.ForeignKey('dance_class.id'))
    join_date = db.Column(db.DateTime)         # 报班日期
    status = db.Column(db.Integer)             # 报班状态 正常、退班、结束、续班
    remark = db.Column(db.String(140))

    def __init__(self, para):
        if 'student_id' in para:
            self.student_id = para['student_id']
        if 'class_id' in para:
            self.class_id = para['class_id']
        if 'join_date' in para:
            my_date = para['join_date']
            self.join_date = datetime.datetime.strptime(my_date, '%Y/%m/%d')
        if 'status' in para:
            self.status = para['status']
        if 'remark' in para:
            self.remark = para['remark']

    def __repr__(self):
        return '<DanceStudentClass %r,%r>' % (self.student_id, self.class_id)


class DanceCompany(db.Model):
    __tablename__ = 'dance_company'

    id = db.Column(db.Integer, primary_key=True)
    company_name = db.Column(db.String(50, collation='NOCASE'), unique=True, index=True, nullable=False)
    create_at = db.Column(db.DateTime, nullable=False)
    # employees = db.relationship('dance_user', backref='company', lazy='dynamic')

    def __init__(self, company_name):
        self.company_name = company_name
        self.create_at = datetime.datetime.today()

    def __repr__(self):
        return '<DanceCompany %r>' % self.id

whooshalchemy.whoosh_index(app, Post)
