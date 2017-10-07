# -*- coding:utf-8 -*-
from hashlib import md5
from app import db
from app import app
from flask_login import UserMixin
import flask_whooshalchemy as whooshalchemy
import re
import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from tools.tools import get_stu_no, dc_gen_code, gen_code
from flask import g

ROLE_USER = 0
ROLE_ADMIN = 1

GENDER_MALE = '男'
GENDER_FEMALE = '女'


followers = db.Table('followers',
                     db.Column('follower_id', db.Integer, db.ForeignKey('user.id')),
                     db.Column('followed_id', db.Integer, db.ForeignKey('user.id'))
                     )


class DanceUserSchool(db.Model):
    __tablename__ = 'dance_user_school'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('dance_user.id'))
    school_id = db.Column(db.Integer, db.ForeignKey('dance_school.id'))

    @staticmethod
    def get_school_ids_by_uid():
        """ 根据登录用户用户的权限，获取用户能管理的分校 ID 列表 """
        school_ids = []
        schools = DanceUserSchool.query.filter_by(user_id=g.user.id).all()
        for sc in schools:
            school_ids.append(sc.school_id)
        return school_ids

    @staticmethod
    def get_school_map_by_uid():
        """ 根据登录用户用户的权限，获取用户能管理的分校 ID、名称 列表 """
        school_ids = []
        school_ids_map = {}
        schools = DanceUserSchool.query.filter_by(user_id=g.user.id)\
            .join(DanceSchool, DanceSchool.id == DanceUserSchool.school_id)\
            .add_columns(DanceSchool.school_name).all()
        for rec in schools:
            sc = rec[0]
            school_ids.append(sc.school_id)
            school_ids_map[sc.school_id] = rec[1]
        return school_ids, school_ids_map


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
    id = db.Column(db.Integer, primary_key=True)            # 自动编号，主键  唯一///
    sno = db.Column(db.String(30))             # 学号，一个培训中心内唯一
    name = db.Column(db.String(40, collation='NOCASE'))  # 姓名
    school_no = db.Column(db.String(20))    # 分校编号 ***废弃***
    school_name = db.Column(db.String(40))  # 分校名称 ***废弃***
    consult_no = db.Column(db.String(30))   # 咨询编号
    rem_code = db.Column(db.String(40))     # 助记码
    gender = db.Column(db.String(4))          # 性别：男/女
    degree = db.Column(db.String(40))       # 文化程度
    birthday = db.Column(db.String(10))       # 出生日期
    register_day = db.Column(db.DateTime)   # 登记日期
    information_source = db.Column(db.String(40))    # 信息来源
    counselor = db.Column(db.String(20))    # 咨询师
    reading_school = db.Column(db.String(40))  # 所在学校
    grade = db.Column(db.String(20))        # 年级
    phone = db.Column(db.String(20))  # 手机号码  不可重复 唯一///
    tel = db.Column(db.String(20))          # 固定电话  ***保留
    address = db.Column(db.String(60))      # 联系地址
    zipcode = db.Column(db.String(10))      # 邮政编码  ***保留
    email = db.Column(db.String(30))   # email  不可重复 唯一///
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
    idcard = db.Column(db.String(30))           # 身份证号
    mother_wechat = db.Column(db.String(60))    # 微信标识  ***保留
    father_wechat = db.Column(db.String(60))    # 微信标识  ***保留
    school_id = db.Column(db.Integer, db.ForeignKey('dance_school.id'))

    def __init__(self, param):
        if 'school_id' in param:
            self.school_id = int(param['school_id'])
        self.sno = self.create_sno() if u'sno' not in param else param[u'sno']
        if u'school_no' in param:
            self.school_no = param[u'school_no']
        if u'school_name' in param:
            self.school_name = param[u'school_name']
        if u'consult_no' in param:
            self.consult_no = param[u'consult_no']
        if u'name' in param:
            self.name = param[u'name']
        if u'rem_code' in param:
            self.rem_code = param[u'rem_code']
        if u'gender' in param:
            self.gender = param[u'gender']
        if u'degree' in param:
            self.degree = param[u'degree']
        if u'birthday' in param:
            self.birthday = param[u'birthday']
        if u'register_day' in param:
            self.register_day = datetime.datetime.strptime(param[u'register_day'], '%Y-%m-%d')
            if self.register_day.date() == datetime.date.today():
                self.register_day = datetime.datetime.today()
        else:
            self.register_day = datetime.datetime.today()
        if u'information_source' in param:
            self.information_source = param[u'information_source']
        if u'counselor' in param:
            self.counselor = param[u'counselor']
        if u'reading_school' in param:
            self.reading_school = param[u'reading_school']
        if u'grade' in param:
            self.grade = param[u'grade']
        if u'phone' in param:
            self.phone = param[u'phone']
        if u'tel' in param:
            self.tel = param[u'tel']
        if u'address' in param:
            self.address = param[u'address']
        if u'zipcode' in param:
            self.zipcode = param[u'zipcode']
        if 'email' in param:
            self.email = param[u'email']
        if u'qq' in param:
            self.qq = param[u'qq']
        if u'wechat' in param:
            self.wechat = param[u'wechat']
        if 'mother_name' in param:
            self.mother_name = param[u'mother_name']
        if u'father_name' in param:
            self.father_name = param[u'father_name']
        if u'mother_phone' in param:
            self.mother_phone = param[u'mother_phone']
        if u'father_phone' in param:
            self.father_phone = param[u'father_phone']
        if u'mother_tel' in param:
            self.mother_tel = param[u'mother_tel']
        if u'father_tel' in param:
            self.father_tel = param[u'father_tel']
        if u'mother_company' in param:
            self.mother_company = param[u'mother_company']
        if u'father_company' in param:
            self.father_company = param[u'father_company']
        if u'card' in param:
            self.card = param[u'card']
        self.is_training = u'是' if u'is_training' not in param else param[u'is_training']
        if u'points' in param:
            self.points = int(param[u'points'])
        if u'remark' in param:
            self.remark = param[u'remark']
        self.recorder = param[u'recorder'] if u'recorder' in param else g.user.name
        if 'idcard' in param:
            self.idcard = param['idcard']
        if 'mother_wechat' in param:
            self.mother_wechat = param['mother_wechat']
        if 'father_wechat' in param:
            self.father_wechat = param['father_wechat']

    def getval(self, col_name):
        """
        根据列名获取属性信息，用于Excel导出的统一处理。
        :param col_name:        要查询的列属性
        :return:                返回列名对应的值
        """
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
        elif col_name == 'school_id':
            return self.school_id
        else:
            return '<Unknown field name>'

    def update(self, param):
        """
        更新学员信息
        :param param:        要更新的字段。其中不可以更新的字段有 school_id, sno, consult_no, school_no, school_name,
            is_training, recorder。若传入这些字段，会被忽略。
        :return:
        """
        if u'name' in param:
            self.name = param[u'name']
        if u'rem_code' in param:
            self.rem_code = param[u'rem_code']
        if u'gender' in param:
            self.gender = param[u'gender']
        if u'degree' in param:
            self.degree = param[u'degree']
        if u'birthday' in param:
            self.birthday = param[u'birthday']
        if u'register_day' in param:
            self.register_day = datetime.datetime.strptime(param[u'register_day'], '%Y-%m-%d')
            if self.register_day.date() == datetime.date.today():
                self.register_day = datetime.datetime.today()
        else:
            self.register_day = datetime.datetime.today()
        if u'information_source' in param:
            self.information_source = param[u'information_source']
        if u'counselor' in param:
            self.counselor = param[u'counselor']
        if u'reading_school' in param:
            self.reading_school = param[u'reading_school']
        if u'grade' in param:
            self.grade = param[u'grade']
        if u'phone' in param:
            self.phone = param[u'phone']
        if u'tel' in param:
            self.tel = param[u'tel']
        if u'address' in param:
            self.address = param[u'address']
        if u'zipcode' in param:
            self.zipcode = param[u'zipcode']
        if u'email' in param:
            self.email = param[u'email']
        if u'qq' in param:
            self.qq = param[u'qq']
        if u'wechat' in param:
            self.wechat = param[u'wechat']
        if u'mother_name' in param:
            self.mother_name = param[u'mother_name']
        if u'father_name' in param:
            self.father_name = param[u'father_name']
        if u'mother_phone' in param:
            self.mother_phone = param[u'mother_phone']
        if u'father_phone' in param:
            self.father_phone = param[u'father_phone']
        if u'mother_tel' in param:
            self.mother_tel = param[u'mother_tel']
        if u'father_tel' in param:
            self.father_tel = param[u'father_tel']
        if u'mother_company' in param:
            self.mother_company = param[u'mother_company']
        if u'father_company' in param:
            self.father_company = param[u'father_company']
        if u'card' in param:
            self.card = param[u'card']
        if u'points' in param:
            self.points = int(param[u'points'])
        if u'remark' in param:
            self.remark = param[u'remark']
        if 'idcard' in param:
            self.idcard = param['idcard']
        if 'mother_wechat' in param:
            self.mother_wechat = param['mother_wechat']
        if 'father_wechat' in param:
            self.father_wechat = param['father_wechat']

    def create_sno(self):
        if self.school_id is None:
            raise Exception('Please input school_id first!')
        search_sno = get_stu_no(self.school_id)
        stu = DanceStudent.query.filter(DanceStudent.sno.like(
            '%' + search_sno + '%')).order_by(DanceStudent.id.desc()).first()
        number = 1 if stu is None else int(stu.sno.rsplit('-', 1)[1]) + 1
        self.sno = search_sno + ('%03d' % number)
        return self.sno

    @staticmethod
    def get_id(school_id, sno):
        stu = DanceStudent.query.filter(DanceStudent.school_id == school_id, DanceStudent.sno == sno).first()
        return -1 if stu is None else stu.id

    @staticmethod
    def get_records(school_id):
        records = DanceStudent.query.filter(DanceStudent.school_id.in_(school_id)).all()
        ret = {}
        for rec in records:
            ret[rec.sno] = rec
        return ret

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
    class_style = db.Column(db.String(20))  # 班级形式： 集体课 -- 0, 1对1 -- 1     09
    teacher = db.Column(db.String(20))      # 授课老师姓名        10
    cost_mode = db.Column(db.String(20))    # 收费模式            11     1-按课次  2-按课时
    cost = db.Column(db.Integer)            # 收费标准            12
    plan_students = db.Column(db.Integer)   # 计划招收人数        13
    cur_students = db.Column(db.Integer)    # 当前人数            14
    is_ended = db.Column(db.Integer)        # 是否结束      1 -- 结束； 0 -- 未结束       15
    remark = db.Column(db.String(140))      # 备注         16
    recorder = db.Column(db.String(20))     # 录入员       17
    school_id = db.Column(db.Integer, db.ForeignKey('dance_school.id'))

    def __init__(self, param):
        if 'cno' in param:
            self.cno = param['cno']              # 02
        if 'school_no' in param:
            self.school_no = param['school_no']         # 03
        if 'school_name' in param:
            self.school_name = param['school_name']      # 04
        if 'class_name' in param:
            self.class_name = param['class_name']        # 班级名称          05
        if 'rem_code' in param:
            self.rem_code = param['rem_code']        # 助记码            06
        if 'begin_year' in param:
            self.begin_year = param['begin_year']        # 开班年份      07
        if 'class_type' in param:
            self.class_type = param['class_type']        # 班级类型， 教授类别： 舞蹈、美术、跆拳道、国际象棋等   08
        if 'class_style' in param:
            self.class_style = param['class_style']      # 班级形式： 集体课, 1对1      09
        if 'teacher' in param:
            self.teacher = param['teacher']              # 授课老师姓名        10
        if 'cost_mode' in param:
            self.cost_mode = param['cost_mode']          # 收费模式            11
        if 'cost' in param:
            self.cost = param['cost']                    # 收费标准            12
        if 'plan_students' in param:
            self.plan_students = param['plan_students']      # 计划招收人数        13
        if 'cur_students' in param:
            self.cur_students = param['cur_students']        # 当前人数            14
        if 'is_ended' in param:
            self.is_ended = param['is_ended']            # 是否结束      1 -- 结束； 0 -- 未结束       15
        if 'remark' in param:
            self.remark = param['remark']            # 备注         16
        if 'recorder' in param:
            self.recorder = param['recorder']        # 录入员       17
        if 'school_id' in param:
            self.school_id = int(param['school_id'])

    @staticmethod
    def get_class_id_map():
        school_ids = DanceSchool.get_school_id_lst()
        if len(school_ids) == 0:
            return {}
        classes = DanceClass.query.filter_by(is_ended=0).filter(DanceClass.school_id.in_(school_ids)).all()
        ret = {}
        for cls in classes:
            ret[cls.cno.lower()] = cls.id
        return ret

    @staticmethod
    def get_records(school_id):
        records = DanceClass.query.filter(DanceClass.school_id.in_(school_id)).all()
        ret = {}
        for rec in records:
            ret[rec.cno] = rec
        return ret

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

    def __init__(self, param):
        if 'school_no' in param:
            self.school_no = param['school_no']   # 分校编号          02
        if 'school_name' in param:
            self.school_name = param['school_name']      # 分校名称          03
        if 'address' in param:
            self.address = param['address']        # 分校地址          04
        if 'rem_code' in param:
            self.rem_code = param['rem_code']        # 助记码            05
        if 'zipcode' in param:
            self.zipcode = param['zipcode']  # 邮政编码          06
        if 'manager' in param:
            self.manager = param['manager']  # 负责人姓名        07
        if 'tel' in param:
            self.class_style = param['tel']  # 分校联系电话      08
        if 'manager_phone' in param:
            self.manager_phone = param['manager_phone']  # 负责人手机        09
        if 'remark' in param:
            self.remark = param['remark']  # 备注         10
        self.recorder = g.user.name if 'recorder' not in param else param['recorder']
        self.company_id = int(param['company_id']) if 'company_id' in param else g.user.company_id

    def update_data(self, param):
        if 'school_no' in param:
            self.school_no = param['school_no']         # 分校编号
        if 'school_name' in param:
            self.school_name = param['school_name']      # 分校名称
        if 'address' in param:
            self.address = param['address']        # 分校地址
        if 'rem_code' in param:
            self.rem_code = param['rem_code']        # 助记码
        if 'zipcode' in param:
            self.zipcode = param['zipcode']  # 邮政编码
        if 'manager' in param:
            self.manager = param['manager']  # 负责人姓名
        if 'tel' in param:
            self.class_style = param['tel']  # 分校联系电话
        if 'manager_phone' in param:
            self.manager_phone = param['manager_phone']  # 负责人手机
        if 'remark' in param:
            self.remark = param['remark']  # 备注
        if 'recorder' in param:
            self.recorder = param['recorder']  # 录入员
        if 'company_id' in param:
            self.company_id = int(param['company_id'])

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

    @staticmethod
    def get_school_id_lst():
        schools = DanceSchool.query.filter(DanceSchool.company_id == g.user.company_id).all()
        school_list = []
        for sc in schools:
            school_list.append(sc.id)
        return school_list

    @staticmethod
    def dc_school(scope=None):
        """
        查询当前用户可以管理的 分校 列表
        输入参数： scope   == 'all' 查询当前用户所在中心的所有分校。 否则，查找当前用户能够管理的分校
        :return:
        [{
            school_id:      分校id
            school_no:      分校编号
            school_name:    分校名称
        }]
        """
        dcq = DanceSchool.query.filter(DanceSchool.company_id == g.user.company_id)
        if scope is not None and scope == 'all':
            school_ids = DanceUserSchool.get_school_ids_by_uid()
            dcq = dcq.filter(DanceSchool.id.in_(school_ids))

        schools = dcq.all()
        ret = []
        for sc in schools:
            ret.append({'school_id': sc.id, 'school_no': sc.school_no, 'school_name': sc.school_name})
        return ret

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

    def __init__(self, param):
        if 'user_no' in param:
            self.user_no = param['user_no']   # 用户编号 02
        else:
            self.create_user_no()

        if 'name' in param:
            self.name = param['name']        # 用户名称 03
        else:
            raise Exception(u'[name] field not found!')
        if 'pwd' in param:
            self.pwd = generate_password_hash(param['pwd'])          # 用户密码 04
        else:
            raise Exception(u'[pwd] field not found!')
        if 'phone' in param:
            self.phone = param['phone']      # 联系电话 05
        # ---------------------- role_id not ROLE_USER， ROLE_ADMIN  ---------------------------------------------------
        self.role_id = ROLE_USER if 'role_id' not in param or param['role_id'] != ROLE_ADMIN else ROLE_ADMIN
        self.recorder = g.user.name if g.user.is_authenticated else u'[系统]'
        if 'email' in param:
            self.email = param['email']
        if 'company_id' in param:
            self.company_id = param['company_id']
        elif g.user.is_authenticated:
            self.company_id = g.user.company_id
        else:
            raise Exception(u'[company_id] field not found!')
        self.is_logged = 0
        self.is_creator = 0 if 'is_creator' not in param or param['is_creator'] != 1 else 1
        self.create_at = datetime.datetime.today()

    def create_user_no(self):
        if g.user.is_authenticated:
            rec = DanceUser.query.filter_by(company_id=g.user.company_id).order_by(
                DanceUser.user_no.desc()).first()
            self.user_no = 1 if rec is None else int(rec.user_no) + 1
        else:
            self.user_no = 1
        return self.user_no

    def update_data(self, param):
        if 'user_no' in param:
            self.user_no = param['user_no']  # 用户编号 02
        if 'name' in param:
            self.name = param['name']        # 用户名称 03
        if 'pwd' in param:
            self.pwd = param['pwd']          # 用户密码 04
        if 'phone' in param:
            self.phone = param['phone']      # 联系电话 05
        if 'role' in param:
            self.role_id = param['role_id']        # 所属角色 06
        if 'recorder' in param:
            self.recorder = param['recorder']    # 录入员 08
        self.is_logged = 0 if 'is_logged' not in param else param['is_logged']

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
    id = db.Column(db.Integer, primary_key=True)  # id
    student_id = db.Column(db.String(30, collation='NOCASE'), nullable=False, index=True)
    class_id = db.Column(db.String(20, collation='NOCASE'), nullable=False, index=True)
    company_id = db.Column(db.Integer, nullable=False, index=True)
    join_date = db.Column(db.DateTime)       # 报班日期
    status = db.Column(db.String(10))        # 报班状态 正常、退班、结束、续班
    remark = db.Column(db.String(140))

    def __init__(self, param):
        if 'student_id' in param:
            self.student_id = param['student_id']
        if 'class_id' in param:
            self.class_id = param['class_id']
        if 'join_date' in param:
            my_date = param['join_date']
            datefmt = '%Y/%m/%d' if '/' in my_date else '%Y-%m-%d'
            self.join_date = datetime.datetime.strptime(my_date, datefmt)
        if 'status' in param:
            self.status = param['status']
        if 'remark' in param:
            self.remark = param['remark']
        self.company_id = param['company_id'] if 'company_id' in param else g.user.company_id

    def update(self, param):
        """
        更新 学员报班信息。 不可改变的字段：student_id, company_id
        :param param:
        :return:
        """
        if 'join_date' in param:
            my_date = param['join_date']
            datefmt = '%Y/%m/%d' if '/' in my_date else '%Y-%m-%d'
            self.join_date = datetime.datetime.strptime(my_date, datefmt)
        if 'class_id' in param:
            self.class_id = param['class_id']
        if 'status' in param:
            self.status = param['status']
        if 'remark' in param:
            self.remark = param['remark']

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


class DanceReceipt(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    receipt_no = db.Column(db.String(20, collation='NOCASE'), index=True, nullable=False)
    school_id = db.Column(db.Integer, db.ForeignKey('dance_school.id'))
    student_id = db.Column(db.Integer, db.ForeignKey('dance_student.id'))
    deal_date = db.Column(db.DateTime, nullable=False)      # 收费日期
    receivable_fee = db.Column(db.Float)    # 应收学费
    teaching_fee = db.Column(db.Float)    # 教材费
    other_fee = db.Column(db.Float)    # 其他费
    total = db.Column(db.Float)  # 费用合计
    real_fee = db.Column(db.Float)  # 实收费合计
    arrearage = db.Column(db.Float)    # 学费欠费
    counselor = db.Column(db.String(20, collation='NOCASE'))      # 咨询师
    remark = db.Column(db.String(40))
    recorder = db.Column(db.String(20, collation='NOCASE'))
    fee_mode = db.Column(db.String(6))      # 收费方式 支付宝/微信/刷卡/现金
    paper_receipt = db.Column(db.String(15))    # 收据号  例如：1347269
    type = db.Column(db.Integer)    # 收费单类型（学费 1、演出 2、普通 3）

    def __init__(self, param):
        if 'school_id' in param:
            self.school_id = param['school_id']
        else:
            raise Exception('need school_id field!')
        if 'receipt_no' in param:
            self.receipt_no = param['receipt_no']
        else:
            self.receipt_no = self.create_code()
        if 'student_id' in param:
            self.student_id = param['student_id']
        else:
            raise Exception('need student_id field!')
        if u'deal_date' in param:
            self.deal_date = datetime.datetime.strptime(param[u'deal_date'], '%Y-%m-%d')
            if self.deal_date.date() == datetime.date.today():
                self.deal_date = datetime.datetime.today()
        else:
            self.deal_date = datetime.datetime.today()
        self.receivable_fee\
            = param['receivable_fee'] if 'receivable_fee' in param and param['receivable_fee'] != '' else None
        self.teaching_fee = param['teaching_fee'] if 'teaching_fee' in param and param['teaching_fee'] != '' else None
        self.other_fee = param['other_fee'] if 'other_fee' in param and param['other_fee'] != '' else None
        self.total = param['total'] if 'total' in param and param['total'] != '' else None
        self.real_fee = param['real_fee'] if 'real_fee' in param and param['real_fee'] != '' else None
        self.arrearage = param['arrearage'] if 'arrearage' in param and param['arrearage'] != '' else None
        if 'counselor' in param:
            self.counselor = param['counselor']
        if 'remark' in param:
            self.remark = param['remark']
        self.recorder = param['recorder'] if 'recorder' in param else g.user.name
        if 'fee_mode' in param:
            self.fee_mode = param['fee_mode']
        if 'paper_receipt' in param:
            self.paper_receipt = param['paper_receipt']
        self.type = 1 if 'type' not in param else param['type']
        
    def update(self, param):
        if 'student_id' in param:
            self.student_id = param['student_id']
        if u'deal_date' in param:
            self.deal_date = datetime.datetime.strptime(param[u'deal_date'], '%Y-%m-%d')
            if self.deal_date.date() == datetime.date.today():
                self.deal_date = datetime.datetime.today()
        else:
            self.deal_date = datetime.datetime.today()
        self.receivable_fee\
            = param['receivable_fee'] if 'receivable_fee' in param and param['receivable_fee'] != '' else None
        self.teaching_fee = param['teaching_fee'] if 'teaching_fee' in param and param['teaching_fee'] != '' else None
        self.other_fee = param['other_fee'] if 'other_fee' in param and param['other_fee'] != '' else None
        self.total = param['total'] if 'total' in param and param['total'] != '' else None
        self.real_fee = param['real_fee'] if 'real_fee' in param and param['real_fee'] != '' else None
        self.arrearage = param['arrearage'] if 'arrearage' in param and param['arrearage'] != '' else None
        if 'counselor' in param:
            self.counselor = param['counselor']
        if 'remark' in param:
            self.remark = param['remark']
        self.recorder = param['recorder'] if 'recorder' in param else g.user.name
        if 'fee_mode' in param:
            self.fee_mode = param['fee_mode']
        if 'paper_receipt' in param:
            self.paper_receipt = param['paper_receipt']
        self.type = 1 if 'type' not in param else param['type']

    @staticmethod
    def get_ids(school_ids):
        """ 根据分校 id 查询 收费单。返回 收费单编号 - 收费单id 的 key - value 对 """
        records = DanceReceipt.query.filter(DanceReceipt.school_id.in_(school_ids)).all()
        ret = {}
        for rec in records:
            ret[rec.receipt_no] = rec.id
        return ret

    @staticmethod
    def get_records(school_ids):
        """根据分校id查询收费单，返回 收费单编号 - 收费单记录的key - value对 """
        ret = {}
        records = DanceReceipt.query.filter(DanceReceipt.school_id.in_(school_ids)).all()
        for rec in records:
            ret[rec.receipt_no] = rec
        return ret

    def create_code(self):
        if self.school_id is None:
            raise Exception('Please input school_id first!')
        search_no = dc_gen_code(self.school_id, 'SFD')
        rec = DanceReceipt.query.filter(DanceReceipt.receipt_no.like('%' + search_no + '%'))\
            .order_by(DanceReceipt.id.desc()).first()
        number = 1 if rec is None else int(rec.receipt_no.rsplit('-', 1)[1]) + 1
        self.receipt_no = search_no + ('%03d' % number)
        return self.receipt_no

    def __repr__(self):
        return '<DanceReceipt %r>' % self.receipt_no


class DanceClassReceipt(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    receipt_id = db.Column(db.Integer, db.ForeignKey('dance_receipt.id'))
    class_id = db.Column(db.Integer, db.ForeignKey('dance_class.id'))
    term = db.Column(db.Integer, nullable=False)  # 学期长度
    sum = db.Column(db.Float, nullable=False)  # 优惠前学费
    discount = db.Column(db.Float)  # 优惠 金额
    discount_rate = db.Column(db.Float)  # 折扣率
    total = db.Column(db.Float, nullable=False)     # 应收学费
    real_fee = db.Column(db.Float, nullable=False)  # 实收学费
    arrearage = db.Column(db.Float)  # 学费欠费
    begin_date = db.Column(db.Date)  # 计费日期
    end_date = db.Column(db.Date)  # 到期日期
    remark = db.Column(db.String(40))

    def __init__(self, param):
        if 'receipt_id' in param:
            self.receipt_id = param['receipt_id']
        else:
            raise Exception('[receipt_id] required!')
        if 'class_id' in param:
            self.class_id = param['class_id']
        else:
            raise Exception('[class_id] required!')
        if 'term' in param:
            self.term = param['term']
        if 'sum' in param:
            self.sum = param['sum']
        if 'discount' in param and param['discount'] != '':
            self.discount = param['discount']
        if 'discount_rate' in param and param['discount_rate'] != '':
            self.discount_rate = param['discount_rate']
        if 'total' in param:
            self.total = param['total']
        if 'real_fee' in param:
            self.real_fee = param['real_fee']
        if 'arrearage' in param and param['arrearage'] != '':
            self.arrearage = param['arrearage']
        if 'begin_date' in param and param['begin_date'] != '':
            my_date = param['begin_date']
            datefmt = '%Y/%m/%d' if '/' in my_date else '%Y-%m-%d'
            self.begin_date = datetime.datetime.strptime(my_date, datefmt).date()
        if 'end_date' in param and param['end_date'] != '':
            my_date = param['begin_date']
            datefmt = '%Y/%m/%d' if '/' in my_date else '%Y-%m-%d'
            self.end_date = datetime.datetime.strptime(my_date, datefmt).date()
        if 'remark' in param:
            self.remark = param['remark']
            
    def update(self, param):
        if 'receipt_id' in param:
            self.receipt_id = param['receipt_id']
        if 'class_id' in param:
            self.class_id = param['class_id']
        if 'term' in param:
            self.term = param['term']
        if 'sum' in param:
            self.sum = param['sum']
        if 'discount' in param:
            self.discount = None if param['discount'] == '' else param['discount']
        if 'discount_rate' in param:
            self.discount_rate = None if param['discount_rate'] == '' else param['discount_rate']
        if 'total' in param:
            self.total = param['total']
        if 'real_fee' in param:
            self.real_fee = param['real_fee']
        if 'arrearage' in param:
            self.arrearage = None if param['arrearage'] == '' else param['arrearage']
        if 'begin_date' in param:
            if param['begin_date'] != '':
                my_date = param['begin_date']
                datefmt = '%Y/%m/%d' if '/' in my_date else '%Y-%m-%d'
                self.begin_date = datetime.datetime.strptime(my_date, datefmt).date()
            else:
                self.begin_date = None
        if 'end_date' in param:
            if param['end_date'] != '':
                my_date = param['begin_date']
                datefmt = '%Y/%m/%d' if '/' in my_date else '%Y-%m-%d'
                self.end_date = datetime.datetime.strptime(my_date, datefmt).date()
            else:
                self.end_date = None
        if 'remark' in param:
            self.remark = param['remark']

    def __repr__(self):
        return '<DanceClassReceipt %r>' % self.id


class DanceTeaching(db.Model):
    """ 学员教材费表 """
    id = db.Column(db.Integer, primary_key=True)
    receipt_id = db.Column(db.Integer, db.ForeignKey('dance_receipt.id'))
    class_id = db.Column(db.Integer)
    material_id = db.Column(db.Integer)     # 教材 id
    is_got = db.Column(db.String(2), nullable=False)  # 是否领取
    fee = db.Column(db.Integer, nullable=False)     # 教材费
    remark = db.Column(db.String(40))
    dt_num = db.Column(db.Integer)      # 教材数量

    def __init__(self, param):
        if 'receipt_id' in param:
            self.receipt_id = param['receipt_id']
        else:
            raise Exception('[receipt_id] required!')
        if 'class_id' in param:
            self.class_id = param['class_id']
        if 'material_id' in param:
            self.material_id = param['material_id']
        if 'is_got' in param:
            self.is_got = param['is_got']
        if 'fee' in param and param['fee'] != '':
            self.fee = param['fee']
        if 'remark' in param:
            self.remark = param['remark']
        self.dt_num = param['dt_num'] if 'dt_num' in param else 1

    def update(self, param):
        """ 更新教材费，其中收费单 id 不可用更改 """
        if 'class_id' in param:
            self.class_id = param['class_id']
        if 'material_id' in param:
            self.material_id = param['material_id']
        if 'is_got' in param:
            self.is_got = param['is_got']
        if 'fee' in param and param['fee'] != '':
            self.fee = param['fee']
        if 'remark' in param:
            self.remark = param['remark']
        if 'dt_num' in param:
            self.dt_num = param['dt_num']

    def __repr__(self):
        return '<DanceTeaching %r>' % self.id


class DanceOtherFee(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    receipt_id = db.Column(db.Integer, db.ForeignKey('dance_receipt.id'))
    class_id = db.Column(db.Integer)
    fee_item_id = db.Column(db.Integer)     # 收费项目 id
    summary = db.Column(db.String(40, collation='NOCASE'))  # 摘要
    real_fee = db.Column(db.Float, nullable=False)  # 收费
    remark = db.Column(db.String(40))

    def __init__(self, param):
        if 'receipt_id' in param:
            self.receipt_id = param['receipt_id']
        else:
            raise Exception('[receipt_id] required!')
        if 'class_id' in param:
            self.class_id = param['class_id']
        if 'fee_item_id' in param:
            self.fee_item_id = param['fee_item_id']
        if 'summary' in param:
            self.summary = param['summary']
        if 'real_fee' in param:
            self.real_fee = param['real_fee']
        if 'remark' in param:
            self.remark = param['remark']

    def __repr__(self):
        return '<DanceOtherFee %r>' % self.id


class DcFeeItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    fee_item = db.Column(db.String(20, collation='NOCASE'))  # 收费项目
    company_id = db.Column(db.Integer, db.ForeignKey('dance_company.id'))
    recorder = db.Column(db.String(20, collation='NOCASE'))
    create_at = db.Column(db.DateTime, nullable=False)
    type = db.Column(db.Integer)        # 类别 type: 1 学费， 2 演出， 3，普通

    def __init__(self, name, fee_type=1):
        self.fee_item = name
        self.company_id = g.user.company_id
        self.recorder = g.user.name
        self.create_at = datetime.datetime.today()
        self.type = fee_type

    def update(self, param):
        if 'fee_item' in param:
            self.fee_item = param['fee_item']
        if 'type' in param:
            self.type = param['type']

    @staticmethod
    def get_records():
        records = DcFeeItem.query.filter_by(company_id=g.user.company_id).all()
        ret = {}
        for rec in records:
            ret[rec.fee_item] = rec
        return ret

    def __repr__(self):
        return '<DcFeeItem %r>' % self.fee_item


class DcTeachingMaterial(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('dance_company.id'))
    material_no = db.Column(db.String(10, collation='NOCASE'))  # 教材编号
    material_name = db.Column(db.String(20, collation='NOCASE'))  # 教材名称
    rem_code = db.Column(db.String(20, collation='NOCASE'))
    unit = db.Column(db.String(4, collation='NOCASE'))      # 单位
    price_buy = db.Column(db.Float)
    price_sell = db.Column(db.Float)
    summary = db.Column(db.String(140, collation='NOCASE'))   # 内容简介
    is_use = db.Column(db.String(2), nullable=False)   # 是否启用
    remark = db.Column(db.String(40))
    recorder = db.Column(db.String(20, collation='NOCASE'))
    tm_type = db.Column(db.String(10, collation='NOCASE'))  # 教材类别

    def __init__(self, param):
        self.company_id = g.user.company_id if 'company_id' not in param else param['company_id']
        if 'material_no' in param:
            self.material_no = param['material_no']
        if 'material_name' in param:
            self.material_name = param['material_name']
        if 'rem_code' in param:
            self.rem_code = param['rem_code']
        if 'unit' in param:
            self.unit = param['unit']
        if 'price_buy' in param and param['price_buy'] != '':
            self.price_buy = param['price_buy']
        if 'price_sell' in param and param['price_sell'] != '':
            self.price_sell = param['price_sell']
        if 'summary' in param:
            self.summary = param['summary']
        if 'is_use' in param:
            self.is_use = param['is_use']
        if 'remark' in param:
            self.remark = param['remark']
        self.recorder = g.user.name if 'recorder' not in param else param['recorder']
        if 'tm_type' in param:
            self.tm_type = param['tm_type']

    def update(self, param):
        """ 更新教材信息， 其中 公司id, 教材编号 不可更改 """
        if 'material_name' in param:
            self.material_name = param['material_name']
        if 'rem_code' in param:
            self.rem_code = param['rem_code']
        if 'unit' in param:
            self.unit = param['unit']
        if 'price_buy' in param and param['price_buy'] != '':
            self.price_buy = param['price_buy']
        if 'price_sell' in param and param['price_sell'] != '':
            self.price_sell = param['price_sell']
        if 'summary' in param:
            self.summary = param['summary']
        if 'is_use' in param:
            self.is_use = param['is_use']
        if 'remark' in param:
            self.remark = param['remark']
        self.recorder = g.user.name if 'recorder' not in param else param['recorder']
        if 'tm_type' in param:
            self.tm_type = param['tm_type']

    @staticmethod
    def get_records():
        records = DcTeachingMaterial.query.filter_by(company_id=g.user.company_id).all()
        """
        val = {}
        for rec in records:
            val[rec.material_no] = records
        return val
        """
        return dict((k.material_no, k) for k in records)


class DcCommFeeMode(db.Model):
    """  收费模式表：支付宝、微信、刷卡、现金等 """
    id = db.Column(db.Integer, primary_key=True)
    fee_mode = db.Column(db.String(6, collation='NOCASE'))  # 收费模式
    disc_rate = db.Column(db.Float)     # 点数损失，比如刷信用卡 0.6%
    recorder = db.Column(db.String(20, collation='NOCASE'))
    create_at = db.Column(db.DateTime, nullable=False)
    last_upd_at = db.Column(db.DateTime, nullable=False)
    last_user = db.Column(db.String(20, collation='NOCASE'))    # 最后操作者
    company_id = db.Column(db.Integer, db.ForeignKey('dance_company.id'))

    def __init__(self, name, rate=1):
        self.fee_mode = name
        self.company_id = g.user.company_id
        self.last_user = self.recorder = g.user.name
        self.last_upd_at = self.create_at = datetime.datetime.today()
        self.disc_rate = rate

    def update(self, param):
        if 'fee_mode' in param:
            self.fee_mode = param['fee_mode']
        if 'disc_rate' in param:
            self.disc_rate = param['disc_rate']
        self.last_user = g.user.name
        self.last_upd_at = datetime.datetime.today()

    def __repr__(self):
        return '<DcCommFeeMode %r>' % self.id


class DcShowFeeCfg(db.Model):
    """  演出包含的收费项目配置表 """
    id = db.Column(db.Integer, primary_key=True)
    show_id = db.Column(db.Integer, nullable=False)
    fee_item_id = db.Column(db.Integer, nullable=False)
    cost = db.Column(db.Float)     # 收费金额
    recorder = db.Column(db.String(20, collation='NOCASE'))
    create_at = db.Column(db.DateTime, nullable=False)
    last_upd_at = db.Column(db.DateTime, nullable=False)
    last_user = db.Column(db.String(20, collation='NOCASE'))    # 最后操作者

    def __init__(self, show_id, fee_item_id, cost):
        self.show_id = show_id
        self.fee_item_id = fee_item_id
        self.cost = cost
        self.last_user = self.recorder = g.user.name
        self.last_upd_at = self.create_at = datetime.datetime.today()

    def __repr__(self):
        return '<DcShowFeeCfg %r>' % self.id


class DcShow(db.Model):
    """  演出详细信息表 """
    id = db.Column(db.Integer, primary_key=True)
    show_no = db.Column(db.String(20), nullable=False)
    show_name = db.Column(db.String(40, collation='NOCASE'))
    begin_date = db.Column(db.DateTime)
    end_date = db.Column(db.DateTime)
    address = db.Column(db.String(60, collation='NOCASE'))
    summary = db.Column(db.String(140, collation='NOCASE'))
    is_end = db.Column(db.Integer)      # 是否结束 1 是， 0 否
    join_fee = db.Column(db.Integer)     # 报名费
    other_fee = db.Column(db.Integer)  # 其他费
    total = db.Column(db.Integer)  # 费用合计
    recorder = db.Column(db.String(20, collation='NOCASE'))
    create_at = db.Column(db.DateTime, nullable=False)
    last_upd_at = db.Column(db.DateTime, nullable=False)
    last_user = db.Column(db.String(20, collation='NOCASE'))    # 最后操作者
    company_id = db.Column(db.Integer, db.ForeignKey('dance_company.id'))

    def __init__(self, param):
        self .show_no = param['show_no'] if 'show_no' in param else self.create_code()
        if 'show_name' in param:
            self.show_name = param['show_name']
        if 'begin_date' in param and param['begin_date'] != '':
            self.begin_date = datetime.datetime.strptime(param['begin_date'], '%Y-%m-%d')
        if 'end_date' in param and param['end_date'] != '':
            self.end_date = datetime.datetime.strptime(param['end_date'], '%Y-%m-%d')
        if 'address' in param:
            self.address = param['address']
        if 'summary' in param:
            self.summary = param['summary']
        self.is_end = 0 if 'is_end' not in param or param['is_end'] != u'是' else 1
        self.join_fee = param['join_fee'] if 'join_fee' in param and param['join_fee'] != '' else 0
        self.other_fee = param['other_fee'] if 'other_fee' in param and param['other_fee'] != '' else 0
        self.total = self.join_fee + self.other_fee

        self.last_user = self.recorder = g.user.name
        self.last_upd_at = self.create_at = datetime.datetime.today()
        self.company_id = g.user.company_id

    def update(self, param):
        if 'show_name' in param:
            self.show_name = param['show_name']
        if 'begin_date' in param:
            self.begin_date = datetime.datetime.strptime(param['begin_date'], '%Y-%m-%d')
        if 'end_date' in param:
            self.end_date = datetime.datetime.strptime(param['end_date'], '%Y-%m-%d')
        if 'address' in param:
            self.address = param['address']
        if 'summary' in param:
            self.summary = param['summary']
        if 'is_end' in param:
            self.is_end = param['is_end']
        if 'join_fee' in param:
            self.join_fee = param['join_fee'] if param['join_fee'] != '' else 0
        if 'other_fee' in param:
            self.other_fee = param['other_fee'] if param['other_fee'] != '' else 0
        self.total = self.join_fee + self.other_fee

        self.last_upd_at = datetime.datetime.today()
        self.last_user = g.user.name

    def create_code(self):
        search_no = gen_code('SHW')
        rec = DcShow.query.filter(DcShow.show_no.like('%' + search_no + '%'))\
            .order_by(DcShow.id.desc()).first()
        number = 1 if rec is None else int(rec.show_no.rsplit('-', 1)[1]) + 1
        self.show_no = search_no + ('%03d' % number)
        return self.show_no

    def __repr__(self):
        return '<DcShow %r>' % self.id


class DcShowRecpt(db.Model):
    """  收费单（演出）基本信息表 """
    id = db.Column(db.Integer, primary_key=True)
    show_recpt_no = db.Column(db.String(20), nullable=False)
    school_id = db.Column(db.Integer, nullable=False)
    student_id = db.Column(db.Integer, nullable=False)
    deal_date = db.Column(db.DateTime, nullable=False)
    join_fee = db.Column(db.Float, nullable=False)     # 报名费
    other_fee = db.Column(db.Float)  # 其他费
    total = db.Column(db.Float)  # 费用合计
    fee_mode_id = db.Column(db.Integer)
    recorder = db.Column(db.String(20, collation='NOCASE'))
    create_at = db.Column(db.DateTime, nullable=False)
    last_upd_at = db.Column(db.DateTime, nullable=False)
    last_user = db.Column(db.String(20, collation='NOCASE'))    # 最后操作者
    remark = db.Column(db.String(40))
    paper_receipt = db.Column(db.String(15))  # 收据号  例如：1347269

    def __init__(self, param):
        if 'school_id' in param:
            self.school_id = param['school_id']
        self.show_recpt_no = param['show_recpt_no'] if 'show_recpt_no' in param else self.create_code()
        if 'student_id' in param:
            self.student_id = param['student_id']
        if 'deal_date' in param:
            self.deal_date = datetime.datetime.strptime(param[u'deal_date'], '%Y-%m-%d')
            if self.deal_date.date() == datetime.date.today():
                self.deal_date = datetime.datetime.today()
        else:
            self.deal_date = datetime.datetime.today()
        self.join_fee = param['join_fee'] if 'join_fee' in param and param['join_fee'] != '' else 0
        self.other_fee = param['other_fee'] if 'other_fee' in param and param['other_fee'] != '' else None
        self.total = self.join_fee + (0 if self.other_fee is None else self.other_fee)
        if 'fee_mode_id' in param:
            self.fee_mode_id = param['fee_mode_id']
        self.last_user = self.recorder = g.user.name
        self.last_upd_at = self.create_at = datetime.datetime.today()
        if 'remark' in param:
            self.remark = param['remark']
        if 'paper_receipt' in param:
            self.paper_receipt = param['paper_receipt']

    def update(self, param):
        if 'school_id' in param:
            self.school_id = param['school_id']
        if 'student_id' in param:
            self.student_id = param['student_id']
        if 'deal_date' in param:
            self.deal_date = datetime.datetime.strptime(param[u'deal_date'], '%Y-%m-%d')
            if self.deal_date.date() == datetime.date.today():
                self.deal_date = datetime.datetime.today()
        else:
            self.deal_date = datetime.datetime.today()
        self.join_fee = param['join_fee'] if 'join_fee' in param and param['join_fee'] != '' else 0
        self.other_fee = param['other_fee'] if 'other_fee' in param and param['other_fee'] != '' else None
        self.total = self.join_fee + (0 if self.other_fee is None else self.other_fee)
        if 'fee_mode_id' in param:
            self.fee_mode_id = param['fee_mode_id']
        self.last_upd_at = datetime.datetime.today()
        self.last_user = g.user.name
        if 'remark' in param:
            self.remark = param['remark']
        if 'paper_receipt' in param:
            self.paper_receipt = param['paper_receipt']

    def create_code(self):
        if self.school_id is None:
            raise Exception('Please input school_id first!')
        search_no = dc_gen_code(self.school_id, 'SHW')
        rec = DcShowRecpt.query.filter(DcShowRecpt.show_recpt_no.like('%' + search_no + '%'))\
            .order_by(DcShowRecpt.id.desc()).first()
        number = 1 if rec is None else int(rec.show_recpt_no.rsplit('-', 1)[1]) + 1
        self.show_recpt_no = search_no + ('%03d' % number)
        return self.show_recpt_no

    def __repr__(self):
        return '<DcShowRecpt %r>' % self.id


class DcShowDetailFee(db.Model):
    """  收费单（演出）明细表 """
    id = db.Column(db.Integer, primary_key=True)
    recpt_id = db.Column(db.Integer, nullable=False)
    show_id = db.Column(db.Integer, nullable=False)
    fee_item_id = db.Column(db.Integer, nullable=False)
    fee = db.Column(db.Float, nullable=False)     # 收费金额
    is_rcv = db.Column(db.Integer, nullable=False)  # 是否收取  1 是， 0 否
    recorder = db.Column(db.String(20, collation='NOCASE'))
    create_at = db.Column(db.DateTime, nullable=False)
    last_upd_at = db.Column(db.DateTime, nullable=False)
    last_user = db.Column(db.String(20, collation='NOCASE'))    # 最后操作者
    remark = db.Column(db.String(40))

    def __init__(self, param):
        if 'recpt_id' in param:
            self.recpt_id = param['recpt_id']
        if 'show_id' in param:
            self.show_id = param['show_id']
        if 'fee_item_id' in param:
            self.fee_item_id = param['fee_item_id']
        if 'fee' in param:
            self.fee = param['fee']
        self.is_rcv = 0 if 'is_rcv' not in param or param['is_rcv'] == u'否' else 1
        self.last_user = self.recorder = g.user.name
        self.last_upd_at = self.create_at = datetime.datetime.today()
        if 'remark' in param:
            self.remark = param['remark']

    def update(self, param):
        if 'fee_item_id' in param:
            self.fee_item_id = param['fee_item_id']
        if 'fee' in param:
            self.fee = param['fee']
        if 'is_rcv' in param:
            self.is_rcv = 0 if param['is_rcv'] == u'否' else 1
        self.last_upd_at = datetime.datetime.today()
        self.last_user = g.user.name
        if 'remark' in param:
            self.remark = param['remark']

    def __repr__(self):
        return '<DcShowDetailFee %r>' % self.id


class DcClassType(db.Model):
    """ 班级类型表 """
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20, collation='NOCASE'))
    recorder = db.Column(db.String(20, collation='NOCASE'))
    create_at = db.Column(db.DateTime, nullable=False)
    last_upd_at = db.Column(db.DateTime, nullable=False)
    last_user = db.Column(db.String(20, collation='NOCASE'))
    company_id = db.Column(db.Integer, db.ForeignKey('dance_company.id'))

    def __init__(self, param):
        self.name = param['name']
        self.last_user = self.recorder = g.user.name
        self.last_upd_at = self.create_at = datetime.datetime.today()
        self.company_id = g.user.company_id

    def update(self, param):
        if 'name' in param:
            self.name = param['name']
        self.last_user = g.user.name
        self.last_upd_at = datetime.datetime.today()

    def __repr__(self):
        return '<DcClassType %r>' % self.id


class DanceTeacher(db.Model):
    """
    员工与老师信息 表
    """
    id = db.Column(db.Integer, primary_key=True)
    teacher_no = db.Column(db.String(20, collation='NOCASE'))
    school_id = db.Column(db.Integer)
    name = db.Column(db.String(40, collation='NOCASE'))  # 姓名
    rem_code = db.Column(db.String(40))  # 助记码
    gender = db.Column(db.Integer)  # 性别：男1/女0
    degree = db.Column(db.String(20))  # 文化程度
    birthday = db.Column(db.String(10))  # 出生日期
    join_date = db.Column(db.DateTime)  # 入职日期
    te_type = db.Column(db.Integer)  # 类别：专职1/兼职0
    te_title = db.Column(db.Integer)  # 职位：校长、教师、前台、咨询师、清洁工、会计、出纳
    in_job = db.Column(db.Integer)  # 是否在职：是1 / 否0
    idcard = db.Column(db.String(30))  # 身份证号

    recorder = db.Column(db.String(20, collation='NOCASE'))
    create_at = db.Column(db.DateTime, nullable=False)
    last_upd_at = db.Column(db.DateTime, nullable=False)
    last_user = db.Column(db.String(20, collation='NOCASE'))
    company_id = db.Column(db.Integer, db.ForeignKey('dance_company.id'))


whooshalchemy.whoosh_index(app, Post)
