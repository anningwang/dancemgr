# -*- coding:utf-8 -*-
from app import db
from flask_login import UserMixin
import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from tools.tools import dc_gen_code, gen_code
from flask import g
from dcglobal import *

ROLE_USER = 0
ROLE_ADMIN = 1


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


class DanceStudent(db.Model):
    """
    学员表 -- Anningwang
    """
    id = db.Column(db.Integer, primary_key=True)            # 自动编号，主键  唯一///
    sno = db.Column(db.String(30))             # 学号，一个培训中心内唯一
    name = db.Column(db.String(40, collation='NOCASE'))  # 姓名
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
    company_id = db.Column(db.Integer, index=True)

    def __init__(self, param):
        if 'school_id' in param:
            self.school_id = int(param['school_id'])
        self.sno = self.create_no() if u'sno' not in param else param[u'sno']
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
        self.company_id = g.user.company_id

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
        if 'zipcode' in param:
            self.zipcode = param[u'zipcode']
        if 'email' in param:
            self.email = param[u'email']
        if 'qq' in param:
            self.qq = param['qq']
        if 'wechat' in param:
            self.wechat = param['wechat']
        if 'mother_name' in param:
            self.mother_name = param['mother_name']
        if 'father_name' in param:
            self.father_name = param['father_name']
        if 'mother_phone' in param:
            self.mother_phone = param['mother_phone']
        if 'father_phone' in param:
            self.father_phone = param['father_phone']
        if 'mother_tel' in param:
            self.mother_tel = param['mother_tel']
        if 'father_tel' in param:
            self.father_tel = param['father_tel']
        if 'mother_company' in param:
            self.mother_company = param['mother_company']
        if 'father_company' in param:
            self.father_company = param['father_company']
        if u'card' in param:
            self.card = param[u'card']
        if 'points' in param:
            self.points = int(param[u'points'])
        if 'remark' in param:
            self.remark = param[u'remark']
        if 'idcard' in param:
            self.idcard = param['idcard']
        if 'mother_wechat' in param:
            self.mother_wechat = param['mother_wechat']
        if 'father_wechat' in param:
            self.father_wechat = param['father_wechat']

    def create_no(self):
        if self.school_id is None:
            raise Exception('Please input school_id first!')
        school_no = DanceSchool.get_no(self.school_id)
        if school_no == -1:
            raise Exception('school id [%s] error.' % self.school_id)
        search_sno = dc_gen_code(school_no, 'XH')
        r = DanceStudent.query.filter(DanceStudent.sno.like('%' + search_sno + '%'))\
            .order_by(DanceStudent.id.desc()).first()
        number = 1 if r is None else int(r.sno.rsplit('-', 1)[1]) + 1
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
    class_name = db.Column(db.String(40, collation='NOCASE'))           # 班级名称          05
    rem_code = db.Column(db.String(40, collation='NOCASE'))             # 助记码            06
    begin_year = db.Column(db.String(6))    # 开班年份      07
    class_type = db.Column(db.Integer)      # 班级类型， 教授类别： 舞蹈、美术、跆拳道、国际象棋等   08
    class_style = db.Column(db.Integer)     # 班级形式： 集体课 -- 0, 1对1 -- 1     09
    teacher = db.Column(db.String(20))      # 授课老师姓名        10
    cost_mode = db.Column(db.Integer)       # 收费模式            11     1-按课次  2-按课时
    cost = db.Column(db.Integer)            # 收费标准            12
    plan_students = db.Column(db.Integer)   # 计划招收人数        13
    cur_students = db.Column(db.Integer)    # 当前人数            14
    is_ended = db.Column(db.Integer)        # 是否结束      1 -- 结束； 0 -- 未结束       15
    remark = db.Column(db.String(140))      # 备注         16
    recorder = db.Column(db.String(20))     # 录入员       17
    school_id = db.Column(db.Integer, db.ForeignKey('dance_school.id'))

    def __init__(self, param):
        if 'school_id' in param:
            self.school_id = int(param['school_id'])
        self.cno = param['cno'] if 'cno' in param else self.create_no()
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
        self.recorder = param['recorder'] if 'recorder' in param else g.user.name

    def update(self, param):
        if 'class_name' in param:
            self.class_name = param['class_name']  # 班级名称          05
        if 'rem_code' in param:
            self.rem_code = param['rem_code']  # 助记码            06
        if 'begin_year' in param:
            self.begin_year = param['begin_year']  # 开班年份      07
        if 'class_type' in param:
            self.class_type = param['class_type']  # 班级类型， 教授类别： 舞蹈、美术、跆拳道、国际象棋等   08
        if 'class_style' in param:
            self.class_style = param['class_style']  # 班级形式： 集体课, 1对1      09
        if 'teacher' in param:
            self.teacher = param['teacher']  # 授课老师姓名        10
        if 'cost_mode' in param:
            self.cost_mode = param['cost_mode']  # 收费模式            11
        if 'cost' in param:
            self.cost = param['cost']  # 收费标准            12
        if 'plan_students' in param:
            self.plan_students = param['plan_students']  # 计划招收人数        13
        # if 'cur_students' in param:
        #     self.cur_students = param['cur_students']  # 当前人数            14
        self.refresh_stu_num()
        if 'is_ended' in param:
            self.is_ended = param['is_ended']  # 是否结束      1 -- 结束； 0 -- 未结束       15
        if 'remark' in param:
            self.remark = param['remark']  # 备注         16
        if 'school_id' in param:
            self.school_id = int(param['school_id'])
        self.recorder = param['recorder'] if 'recorder' in param else g.user.name

    @staticmethod
    def get_class_id_map():
        school_ids = DanceSchool.get_id_list()
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

    @staticmethod
    def id_records(school_ids):
        records = DanceClass.query.filter(DanceClass.school_id.in_(school_ids)).all()
        ret = {}
        for rec in records:
            ret[rec.id] = rec
        return ret

    @staticmethod
    def id_records_by(class_ids):
        records = DanceClass.query.filter(DanceClass.id.in_(class_ids)).all()
        ret = {}
        for rec in records:
            ret[rec.id] = rec
        return ret

    def create_no(self):
        if self.school_id is None:
            raise Exception('Please input school_id first!')
        school_no = DanceSchool.get_no(self.school_id)
        if school_no == -1:
            raise Exception('school id [%s] error.' % self.school_id)
        search_sno = dc_gen_code(school_no, 'BJ')
        r = DanceClass.query.filter(DanceClass.cno.like('%' + search_sno + '%'))\
            .order_by(DanceClass.id.desc()).first()
        number = 1 if r is None else int(r.cno.rsplit('-', 1)[1]) + 1
        self.cno = search_sno + ('%03d' % number)
        return self.cno

    def refresh_stu_num(self):
        """更新班级学员名单"""
        self.cur_students = DanceStudentClass.query.filter_by(class_id=self.id, status=STU_CLASS_STATUS_NORMAL).count()
        return self.cur_students

    @staticmethod
    def dc_update_stu_num(class_id):
        """更新班级学员名单"""
        cls = DanceClass.query.get(class_id)
        if cls is None:
            return -1
        num = DanceStudentClass.query.filter_by(class_id=class_id, status=STU_CLASS_STATUS_NORMAL).count()
        cls.cur_students = num
        db.session.add(cls)
        return num

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
        self.school_no = self.create_no() if 'school_no' not in param else param['school_no']
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

    def create_no(self):
        r = DanceSchool.query.filter_by(company_id=g.user.company_id).order_by(DanceSchool.id.desc()).first()
        number = 1 if r is None else int(r.school_no)
        self.school_no = '%04d' % number
        return self.school_no

    @staticmethod
    def get_school_id(school_name):
        school = DanceSchool.query.filter(DanceSchool.school_name == school_name,
                                          DanceSchool.company_id == g.user.company_id).first()
        return -1 if school is None else school.id

    @staticmethod
    def name_to_id():
        """ 分校名称 与 分校 id 键值对"""
        schools = DanceSchool.query.filter(DanceSchool.company_id == g.user.company_id).all()
        school_list = {}
        for sc in schools:
            school_list[sc.school_name.lower()] = sc.id
        return school_list

    @staticmethod
    def no_to_id():
        """ 分校编号 与 分校 id 键值对"""
        schools = DanceSchool.query.filter(DanceSchool.company_id == g.user.company_id).all()
        school_dict = {}
        for sc in schools:
            school_dict[sc.school_no] = sc.id
        return school_dict

    @staticmethod
    def get_id_list():
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
        if scope is not None and scope != 'all':
            school_ids = DanceUserSchool.get_school_ids_by_uid()
            dcq = dcq.filter(DanceSchool.id.in_(school_ids))

        schools = dcq.all()
        ret = []
        for sc in schools:
            ret.append({'school_id': sc.id, 'school_no': sc.school_no, 'school_name': sc.school_name})
        return ret

    @staticmethod
    def get_no(uid):
        r = DanceSchool.query.get(uid)
        if r is None:
            return -1
        return r.school_no

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
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, nullable=False, index=True)
    class_id = db.Column(db.Integer, nullable=False, index=True)
    company_id = db.Column(db.Integer, nullable=False, index=True)
    join_date = db.Column(db.DateTime)       # 报班日期
    status = db.Column(db.String(10))        # 报班状态 正常、退班、结束、已续班
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
    company_id = db.Column(db.Integer, index=True)

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
        self.company_id = g.user.company_id
        
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
        school_no = DanceSchool.get_no(self.school_id)
        if school_no == -1:
            raise Exception('school id [%s] error.' % self.school_id)
        search_no = dc_gen_code(school_no, 'SFD')
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
    company_id = db.Column(db.Integer, index=True)

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
        self.company_id = g.user.company_id

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
        school_no = DanceSchool.get_no(self.school_id)
        if school_no == -1:
            raise Exception('school id [%s] error.' % self.school_id)
        search_no = dc_gen_code(school_no, 'SHW')
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

    @staticmethod
    def dc_class_type():
        """
        查询班级类型
        :return:
        [{
            ct_id:          班级类型id
            ct_name:        班级类型名称
        }]
        """
        dcq = DcClassType.query.filter(DcClassType.company_id == g.user.company_id)

        records = dcq.all()
        ret = []
        for ct in records:
            ret.append({'ct_id': ct.id, 'ct_name': ct.name})
        return ret

    @staticmethod
    def name_id():
        """
        查询记录，返回name和id的键值对
        :return:
        {
            name: id    键值对
        }
        """
        records = DcClassType.query.filter_by(company_id=g.user.company_id).all()
        data = {}
        for rec in records:
            data[rec.name] = rec.id

        return data

    def __repr__(self):
        return '<DcClassType %r>' % self.id


class DanceTeacher(db.Model):
    """
    员工与老师信息 表
    """
    id = db.Column(db.Integer, primary_key=True)
    teacher_no = db.Column(db.String(20, collation='NOCASE'))
    school_id = db.Column(db.Integer)
    name = db.Column(db.String(20, collation='NOCASE'))  # 姓名
    rem_code = db.Column(db.String(20))     # 助记码
    degree = db.Column(db.Integer)          # 文化程度
    birthday = db.Column(db.String(10))     # 出生日期
    join_day = db.Column(db.DateTime)   # 入职日期
    leave_day = db.Column(db.DateTime)  # 离职日期
    te_title = db.Column(db.Integer)    # 职位：校长、教师、前台、咨询师、清洁工、会计、出纳
    gender = db.Column(db.SmallInteger)      # 性别：男1/女0
    te_type = db.Column(db.SmallInteger)     # 类别：专职1/兼职0
    in_job = db.Column(db.SmallInteger)      # 是否在职：是1 / 否0
    is_assist = db.Column(db.SmallInteger)   # 是否咨询师：是1 / 否0
    has_class = db.Column(db.SmallInteger)   # 是否授课：是1 / 否0
    nation = db.Column(db.String(10))   # 民族
    birth_place = db.Column(db.String(10))  # 籍贯
    idcard = db.Column(db.String(30))  # 身份证号
    class_type = db.Column(db.Integer)  # 教授班级类别
    phone = db.Column(db.String(20))  # 手机号码  不可重复 唯一///
    tel = db.Column(db.String(20))  # 固定电话  ***保留
    address = db.Column(db.String(60))  # 联系地址
    zipcode = db.Column(db.String(10))  # 邮政编码  ***保留
    email = db.Column(db.String(30))  # email  不可重复 唯一///
    qq = db.Column(db.String(20))  # qq
    wechat = db.Column(db.String(60))  # 微信标识  ***保留
    recorder = db.Column(db.String(20, collation='NOCASE'))
    create_at = db.Column(db.DateTime, nullable=False)
    last_upd_at = db.Column(db.DateTime, nullable=False)
    last_user = db.Column(db.String(20, collation='NOCASE'))
    company_id = db.Column(db.Integer, db.ForeignKey('dance_company.id'))
    is_all = db.Column(db.SmallInteger)  # 是否所有分校可见：是1 / 否0，排课可以搜索。
    remark = db.Column(db.String(140))  # 备注

    def __init__(self, param):
        if 'school_id' in param:
            self.school_id = param['school_id']
        self.teacher_no = param['teacher_no'] if 'teacher_no' in param else self.create_no()
        if 'name' in param:
            self.name = param['name']
        if 'rem_code' in param:
            self.rem_code = param['rem_code']
        if 'degree' in param and param['degree'] != '':
            self.degree = param['degree']
        if 'birthday' in param:
            self.birthday = param['birthday']
        if 'join_day' in param:
            if param['join_day'] != '':
                self.join_day = datetime.datetime.strptime(param['join_day'], '%Y-%m-%d')
                if self.join_day.date() == datetime.date.today():
                    self.join_day = datetime.datetime.today()
        if 'leave_day' in param:
            if param['leave_day'] != '':
                self.leave_day = datetime.datetime.strptime(param['leave_day'], '%Y-%m-%d')
                if self.leave_day.date() == datetime.date.today():
                    self.leave_day = datetime.datetime.today()
        if 'te_title' in param:
            self.te_title = param['te_title']
        if 'gender' in param:
            self.gender = param['gender']
        if 'te_type' in param:
            self.te_type = param['te_type']
        if 'in_job' in param:
            self.in_job = param['in_job']
        if 'is_assist' in param:
            self.is_assist = param['is_assist']
        if 'has_class' in param:
            self.has_class = param['has_class']
        if 'nation' in param:
            self.nation = param['nation']
        if 'birth_place' in param:
            self.birth_place = param['birth_place']
        if 'idcard' in param:
            self.idcard = param['idcard']
        if 'class_type' in param:
            self.class_type = param['class_type']
        if 'phone' in param:
            self.phone = param['phone']
        if 'tel' in param:
            self.tel = param['tel']
        if 'address' in param:
            self.address = param['address']
        if 'zipcode' in param:
            self.zipcode = param['zipcode']
        if 'email' in param:
            self.email = param['email']
        if 'qq' in param:
            self.qq = param['qq']
        if 'wechat' in param:
            self.wechat = param['wechat']
        self.recorder = param['recorder'] if 'recorder' in param else g.user.name
        self.create_at = datetime.datetime.today()
        self.last_upd_at = datetime.datetime.today()
        self.last_user = g.user.name
        self.company_id = param['company_id'] if 'company_id' in param else g.user.company_id
        if 'is_all' in param:
            self.is_all = param['is_all']
        if 'remark' in param:
            self.remark = param['remark']

    def update(self, param):
        if 'school_id' in param:
            self.school_id = param['school_id']
        if 'name' in param:
            self.name = param['name']
        if 'rem_code' in param:
            self.rem_code = param['rem_code']
        if 'degree' in param:
            self.degree = param['degree']
        if 'birthday' in param:
            self.birthday = param['birthday']
        if 'join_day' in param:
            if param['join_day'] != '':
                self.join_day = datetime.datetime.strptime(param['join_day'], '%Y-%m-%d')
                if self.join_day.date() == datetime.date.today():
                    self.join_day = datetime.datetime.today()
        if 'leave_day' in param:
            if param['leave_day'] != '':
                self.leave_day = datetime.datetime.strptime(param['leave_day'], '%Y-%m-%d')
                if self.leave_day.date() == datetime.date.today():
                    self.leave_day = datetime.datetime.today()
        if 'te_title' in param:
            self.te_title = param['te_title']
        if 'gender' in param:
            self.gender = param['gender']
        if 'te_type' in param:
            self.te_type = param['te_type']
        if 'in_job' in param:
            self.in_job = param['in_job']
        if 'is_assist' in param:
            self.is_assist = param['is_assist']
        if 'has_class' in param:
            self.has_class = param['has_class']
        if 'nation' in param:
            self.nation = param['nation']
        if 'birth_place' in param:
            self.birth_place = param['birth_place']
        if 'idcard' in param:
            self.idcard = param['idcard']
        if 'class_type' in param:
            self.class_type = param['class_type']
        if 'phone' in param:
            self.phone = param['phone']
        if 'tel' in param:
            self.tel = param['tel']
        if 'address' in param:
            self.address = param['address']
        if 'zipcode' in param:
            self.zipcode = param['zipcode']
        if 'email' in param:
            self.email = param['email']
        if 'qq' in param:
            self.qq = param['qq']
        if 'wechat' in param:
            self.wechat = param['wechat']
        self.last_upd_at = datetime.datetime.today()
        self.last_user = g.user.name
        if 'is_all' in param:
            self.is_all = param['is_all']
        if 'remark' in param:
            self.remark = param['remark']

    @staticmethod
    def no_to_id():
        records = DanceTeacher.query.filter_by(company_id=g.user.company_id).all()
        no_id_dict = {}
        for r in records:
            no_id_dict[r.teacher_no] = r.id
        return no_id_dict

    @staticmethod
    def id_to_name():
        records = DanceTeacher.query.filter_by(company_id=g.user.company_id).all()
        teacher_dict = {}
        for r in records:
            teacher_dict[r.id] = r.name
        return teacher_dict

    def create_no(self):
        r = DanceTeacher.query.filter_by(company_id=g.user.company_id).order_by(DanceTeacher.id.desc()).first()
        number = 1 if r is None else int(r.teacher_no.rsplit('-', 1)[1]) + 1
        self.teacher_no = 'JZG-%04d' % number
        return self.teacher_no

    def __repr__(self):
        return '<DanceTeacher %r>' % self.id


class DanceTeacherEdu(db.Model):
    """ 教职工教育经历表"""
    id = db.Column(db.Integer, primary_key=True)
    teacher_id = db.Column(db.Integer, nullable=False)
    begin_day = db.Column(db.Date)
    end_day = db.Column(db.Date)
    school = db.Column(db.String(20))
    major = db.Column(db.String(20))
    remark = db.Column(db.String(40))

    def __init__(self, param):
        if 'teacher_id' in param:
            self.teacher_id = param['teacher_id']
        if 'begin_day' in param and param['begin_day'] != '':
            self.begin_day = datetime.datetime.strptime(param['begin_day'], '%Y-%m').date()
        if 'end_day' in param and param['end_day'] != '':
            self.end_day = datetime.datetime.strptime(param['end_day'], '%Y-%m').date()
        if 'school' in param:
            self.school = param['school']
        if 'major' in param:
            self.major = param['major']
        if 'remark' in param:
            self.remark = param['remark']

    def update(self, param):
        if 'begin_day' in param:
            if param['begin_day'] != '':
                self.begin_day = datetime.datetime.strptime(param['begin_day'], '%Y-%m').date()
            else:
                self.begin_day = None
        if 'end_day' in param:
            if param['end_day'] != '':
                self.end_day = datetime.datetime.strptime(param['end_day'], '%Y-%m').date()
            else:
                self.end_day = None
        if 'school' in param:
            self.school = param['school']
        if 'major' in param:
            self.major = param['major']
        if 'remark' in param:
            self.remark = param['remark']

    def __repr__(self):
        return '<TeacherEdu %r>' % self.id


class DanceTeacherWork(db.Model):
    """ 教职工工作经历表"""
    id = db.Column(db.Integer, primary_key=True)
    teacher_id = db.Column(db.Integer, nullable=False)
    begin_day = db.Column(db.Date)
    end_day = db.Column(db.Date)
    firm = db.Column(db.String(20))
    position = db.Column(db.String(20))
    content = db.Column(db.String(100))  # 主要工作内容
    remark = db.Column(db.String(40))

    def __init__(self, param):
        if 'teacher_id' in param:
            self.teacher_id = param['teacher_id']
        if 'begin_day' in param and param['begin_day'] != '':
            self.begin_day = datetime.datetime.strptime(param['begin_day'], '%Y-%m').date()
        if 'end_day' in param and param['end_day'] != '':
            self.end_day = datetime.datetime.strptime(param['end_day'], '%Y-%m').date()
        if 'firm' in param:
            self.firm = param['firm']
        if 'position' in param:
            self.position = param['position']
        if 'remark' in param:
            self.remark = param['remark']

    def update(self, param):
        if 'begin_day' in param:
            if param['begin_day'] != '':
                self.begin_day = datetime.datetime.strptime(param['begin_day'], '%Y-%m').date()
            else:
                self.begin_day = None
        if 'end_day' in param:
            if param['end_day'] != '':
                self.end_day = datetime.datetime.strptime(param['end_day'], '%Y-%m').date()
            else:
                self.end_day = None
        if 'firm' in param:
            self.firm = param['firm']
        if 'position' in param:
            self.position = param['position']
        if 'remark' in param:
            self.remark = param['remark']

    def __repr__(self):
        return '<TeacherWork %r>' % self.id


class DcCommon(db.Model):
    """ 公共类型表 """
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.Integer, nullable=False)
    name = db.Column(db.String(20, collation='NOCASE'))
    recorder = db.Column(db.String(20, collation='NOCASE'))
    create_at = db.Column(db.DateTime, nullable=False)
    last_upd_at = db.Column(db.DateTime, nullable=False)
    last_user = db.Column(db.String(20, collation='NOCASE'))
    company_id = db.Column(db.Integer, db.ForeignKey('dance_company.id'))
    scope = db.Column(db.Integer)   # 使用于 学员 2，教职工 3，还是全部 1

    def __init__(self, param):
        if 'type' in param:
            self.type = param['type']
        if 'name' in param:
            self.name = param['name']
        if 'scope' in param:
            self.scope = param['scope']
        self.recorder = param['recorder'] if 'recorder' in param else g.user.name
        self.create_at = datetime.datetime.today()
        self.last_upd_at = datetime.datetime.today()
        self.last_user = g.user.name
        self.company_id = param['company_id'] if 'company_id' in param else g.user.company_id

    def update(self, param):
        if 'name' in param:
            self.name = param['name']
        if 'scope' in param:
            self.scope = param['scope']
        self.last_upd_at = datetime.datetime.today()
        self.last_user = g.user.name

    def __repr__(self):
        return '<DcCommon %r>' % self.id

    @staticmethod
    def title_to_id():
        records = DcCommon.query.filter_by(company_id=g.user.company_id, type=COMM_TYPE_JOB_TITLE).all()
        title = {}
        for rec in records:
            title[rec.name] = rec.id
        return title

    @staticmethod
    def id_to_title():
        records = DcCommon.query.filter_by(company_id=g.user.company_id, type=COMM_TYPE_JOB_TITLE).all()
        title = {}
        for rec in records:
            title[rec.id] = rec.name
        return title

    @staticmethod
    def intention_to_id():
        records = DcCommon.query.filter_by(company_id=g.user.company_id, type=COMM_TYPE_INTENTION).all()
        intention = {}
        for rec in records:
            intention[rec.name] = rec.id
        return intention

    @staticmethod
    def name_to_id(ty):
        records = DcCommon.query.filter_by(company_id=g.user.company_id, type=ty).all()
        name_dict = {}
        for rec in records:
            name_dict[rec.name] = rec.id
        return name_dict

    @staticmethod
    def add(ty, name):
        """ 添加记录，返回记录的id"""
        r = DcCommon({'name': name, 'type': ty})
        db.session.add(r)
        r = DcCommon.query.filter_by(company_id=g.user.company_id, type=ty, name=name).first()
        return r.id if r is not None else -1


class DanceCourse(db.Model):
    """ 课程表"""
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(25, collation='NOCASE'), index=True)     # 编号
    name = db.Column(db.String(20, collation='NOCASE'))
    school_id = db.Column(db.Integer, index=True)
    company_id = db.Column(db.Integer, index=True)
    begin = db.Column(db.DateTime, nullable=False)
    end = db.Column(db.DateTime)
    valid = db.Column(db.SmallInteger)
    recorder = db.Column(db.String(20, collation='NOCASE'))
    create_at = db.Column(db.DateTime, nullable=False)
    last_t = db.Column(db.DateTime, nullable=False)
    last_u = db.Column(db.String(20, collation='NOCASE'))

    def __init__(self, param):
        if 'school_id' in param:
            self.school_id = param['school_id']
        if 'code' in param:
            self.code = param['code']
        else:
            self.create_no()
        self.company_id = param['company_id'] if 'company_id' in param else g.user.company_id
        if 'name' in param:
            self.name = param['name']
        if 'begin' in param:
            if param['begin'] != '':
                self.begin = datetime.datetime.strptime(param['begin'], '%Y-%m-%d')
        if 'end' in param:
            if param['end'] != '':
                self.end = datetime.datetime.strptime(param['end'], '%Y-%m-%d')
        self.valid = 1
        self.recorder = param['recorder'] if 'recorder' in param else g.user.name
        self.create_at = datetime.datetime.today()
        self.last_t = datetime.datetime.today()
        self.last_u = g.user.name

    def update(self, param):
        if 'school_id' in param:
            self.school_id = param['school_id']
        if 'begin' in param:
            if param['begin'] != '':
                self.begin = datetime.datetime.strptime(param['begin'], '%Y-%m-%d')
        if 'end' in param:
            if param['end'] != '':
                self.end = datetime.datetime.strptime(param['end'], '%Y-%m-%d')
            else:
                self.end = None
        if 'name' in param:
            self.name = param['name']
        if self.end is not None and datetime.datetime.today() > self.end:
            self.valid = 0
        self.last_t = datetime.datetime.today()
        self.last_u = g.user.name

    def create_no(self):
        if self.school_id is None:
            raise Exception('Please input school_id first!')
        school_no = DanceSchool.get_no(self.school_id)
        if school_no == -1:
            raise Exception('school id [%s] error.' % self.school_id)
        search_sno = dc_gen_code(school_no, 'KC')
        r = DanceCourse.query.filter(DanceCourse.code.like('%' + search_sno + '%'))\
            .order_by(DanceCourse.id.desc()).first()
        number = 1 if r is None else int(r.code.rsplit('-', 1)[1]) + 1
        self.code = search_sno + ('%03d' % number)
        return self.code

    def __repr__(self):
        return '<Course %r>' % self.id


class DanceCourseItem(db.Model):
    """ 课程表 详细项目"""
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, index=True)
    class_id = db.Column(db.Integer)
    short_name = db.Column(db.String(6, collation='NOCASE'))
    teacher_id = db.Column(db.Integer)
    room_id = db.Column(db.Integer)
    time = db.Column(db.String(15))         # 9:00--10:30
    minutes = db.Column(db.SmallInteger)    # 上课时长，单位分钟
    week = db.Column(db.SmallInteger)       # 周几上课 1~7 代表 周一到周天
    fee_id = db.Column(db.Integer)          # 老师课时计费方式id
    company_id = db.Column(db.Integer, index=True)
    last_t = db.Column(db.DateTime, nullable=False)
    last_u = db.Column(db.String(20, collation='NOCASE'))

    def __init__(self, param):
        if 'course_id' in param:
            self.course_id = param['course_id']
        if 'class_id' in param:
            self.class_id = param['class_id']
        if 'short_name' in param:
            self.short_name = param['short_name']
        if 'teacher_id' in param:
            self.teacher_id = param['teacher_id']
        if 'room_id' in param:
            self.room_id = param['room_id']
        if 'time' in param:
            self.time = param['time']
        if 'minutes' in param:
            self.minutes = param['minutes']
        if 'week' in param:
            self.week = param['week']
        if 'fee_id' in param:
            self.fee_id = param['fee_id']
        self.company_id = param['company_id'] if 'company_id' in param else g.user.company_id
        self.last_t = datetime.datetime.today()
        self.last_u = g.user.name

    def update(self, param):
        if 'class_id' in param:
            self.class_id = param['class_id']
        if 'short_name' in param:
            self.short_name = param['short_name']
        if 'teacher_id' in param:
            self.teacher_id = param['teacher_id']
        if 'room_id' in param:
            self.room_id = param['room_id']
        if 'time' in param:
            self.time = param['time']
        if 'minutes' in param:
            self.minutes = param['minutes']
        if 'week' in param:
            self.week = param['week']
        if 'fee_id' in param:
            self.fee_id = param['fee_id']
        self.last_t = datetime.datetime.today()
        self.last_u = g.user.name

    def __repr__(self):
        return '<CourseItem %r>' % self.id


class DanceClassRoom(db.Model):
    """教室信息表"""
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(25, collation='NOCASE'), index=True)  # 编号
    name = db.Column(db.String(20, collation='NOCASE'))
    rem_code = db.Column(db.String(20, collation='NOCASE'))
    school_id = db.Column(db.Integer, index=True)
    address = db.Column(db.String(20))
    area = db.Column(db.Float)
    pnum = db.Column(db.SmallInteger)
    contact_p = db.Column(db.String(20, collation='NOCASE'))
    contact_tel = db.Column(db.String(20))
    recorder = db.Column(db.String(20, collation='NOCASE'))
    create_at = db.Column(db.DateTime, nullable=False)
    last_t = db.Column(db.DateTime, nullable=False)
    last_u = db.Column(db.String(20, collation='NOCASE'))
    company_id = db.Column(db.Integer, index=True)

    def __init__(self, param):
        if 'name' in param:
            self.name = param['name']
        if 'school_id' in param:
            self.school_id = param['school_id']
        self.code = param['code'] if 'code' in param else self.create_no()
        if 'rem_code' in param:
            self.rem_code = param['rem_code']
        if 'address' in param:
            self.address = param['address']
        if 'area' in param and param['area'] != '':
            self.area = param['area']
        if 'pnum' in param:
            self.pnum = param['pnum']
        if 'contact_p' in param:
            self.contact_p = param['contact_p']
        if 'contact_tel' in param:
            self.contact_tel = param['contact_tel']
        if 'recorder' in param:
            self.recorder = param['recorder']
        self.company_id = param['company_id'] if 'company_id' in param else g.user.company_id
        self.create_at = datetime.datetime.today()
        self.last_t = datetime.datetime.today()
        self.last_u = g.user.name

    def update(self, param):
        if 'name' in param:
            self.name = param['name']
        if 'rem_code' in param:
            self.rem_code = param['rem_code']
        if 'address' in param:
            self.address = param['address']
        if 'area' in param:
            self.area = param['area'] if param['area'] != '' else None
        if 'pnum' in param:
            self.pnum = param['pnum']
        if 'contact_p' in param:
            self.contact_p = param['contact_p']
        if 'contact_tel' in param:
            self.contact_tel = param['contact_tel']
        if 'recorder' in param:
            self.recorder = param['recorder']
        self.last_t = datetime.datetime.today()
        self.last_u = g.user.name

    def create_no(self):
        if self.school_id is None:
            raise Exception('Please input school_id first!')
        school_no = DanceSchool.get_no(self.school_id)
        if school_no == -1:
            raise Exception('school id [%s] error.' % self.school_id)
        search_sno = dc_gen_code(school_no, 'JS')
        r = DanceClassRoom.query.filter(DanceClassRoom.code.like('%' + search_sno + '%'))\
            .order_by(DanceClassRoom.id.desc()).first()
        number = 1 if r is None else int(r.code.rsplit('-', 1)[1]) + 1
        self.code = search_sno + ('%03d' % number)
        return self.code

    def __repr__(self):
        return '<ClassRoom %r>' % self.id


class UpgradeClass(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(25, collation='NOCASE'), index=True)
    school_id = db.Column(db.Integer, index=True)
    upg_date = db.Column(db.DateTime, nullable=False)
    old_clsid = db.Column(db.Integer, nullable=False)
    new_clsid = db.Column(db.Integer, nullable=False)

    company_id = db.Column(db.Integer, index=True,  nullable=False)
    recorder = db.Column(db.String(20, collation='NOCASE'))
    create_at = db.Column(db.DateTime, nullable=False)
    last_t = db.Column(db.DateTime, nullable=False)
    last_u = db.Column(db.String(20, collation='NOCASE'))

    def __init__(self, param):
        if 'school_id' in param:
            self.school_id = param['school_id']
        self.code = param.get('code', self.create_no())
        if 'upg_date' in param:
            if param['upg_date'] != '':
                self.upg_date = datetime.datetime.strptime(param['upg_date'], '%Y-%m-%d')
        if 'old_clsid' in param:
            self.old_clsid = param['old_clsid']
        if 'new_clsid' in param:
            self.new_clsid = param['new_clsid']
        self.company_id = param['company_id'] if 'company_id' in param else g.user.company_id
        self.recorder = param.get('recorder', g.user.name)
        self.create_at = datetime.datetime.today()
        self.last_t = self.create_at
        self.last_u = g.user.name

    def update(self, param):
        if 'upg_date' in param:
            if param['upg_date'] != '':
                self.upg_date = datetime.datetime.strptime(param['upg_date'], '%Y-%m-%d')
        if 'old_clsid' in param:
            self.old_clsid = param['old_clsid']
        if 'new_clsid' in param:
            self.new_clsid = param['new_clsid']
        self.last_t = self.create_at
        self.last_u = g.user.name

    def create_no(self):
        if self.school_id is None:
            raise Exception('Please input school_id first!')
        school_no = DanceSchool.get_no(self.school_id)
        if school_no == -1:
            raise Exception('school id [%s] error.' % self.school_id)
        search_sno = dc_gen_code(school_no, 'XB')
        r = UpgradeClass.query.filter(UpgradeClass.code.like('%' + search_sno + '%'))\
            .order_by(UpgradeClass.id.desc()).first()
        number = 1 if r is None else int(r.code.rsplit('-', 1)[1]) + 1
        self.code = search_sno + ('%03d' % number)
        return self.code

    def __repr__(self):
        return '<UpgradeClass %r>' % self.id


class UpgClassItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    upg_id = db.Column(db.Integer, index=True)
    stu_id = db.Column(db.Integer, nullable=False)
    class_id = db.Column(db.Integer, nullable=False)
    is_up = db.Column(db.SmallInteger, nullable=False)
    remark = db.Column(db.String(40))
    company_id = db.Column(db.Integer, index=True, nullable=False)

    def __init__(self, param):
        if 'upg_id' in param:
            self.upg_id = param['upg_id']
        if 'stu_id' in param:
            self.stu_id = param['stu_id']
        if 'class_id' in param:
            self.class_id = param['class_id']
        if 'is_up' in param:
            self.is_up = param['is_up']
        if 'remark' in param:
            self.remark = param['remark']
        self.company_id = g.user.company_id

    def update(self, param):
        if 'class_id' in param:
            self.class_id = param['class_id']
        if 'stu_id' in param:
            self.stu_id = param['stu_id']
        if 'is_up' in param:
            self.is_up = param['is_up']
        if 'remark' in param:
            self.remark = param['remark']

    def __repr__(self):
        return '<UpgradeClass %r>' % self.id


class DanceCheckIn(db.Model):
    """班级考勤表"""
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(25, collation='NOCASE'), index=True, nullable=False)
    school_id = db.Column(db.Integer, index=True, nullable=False)
    class_id = db.Column(db.Integer, nullable=False)
    teacher_id = db.Column(db.Integer, nullable=False)
    date = db.Column(db.DateTime, nullable=False)
    time = db.Column(db.String(15))
    total = db.Column(db.SmallInteger)
    come = db.Column(db.SmallInteger)
    absent = db.Column(db.SmallInteger)
    rate = db.Column(db.Float)
    class_hours = db.Column(db.Float)
    remark = db.Column(db.String(40))
    company_id = db.Column(db.Integer, index=True,  nullable=False)
    recorder = db.Column(db.String(20, collation='NOCASE'))
    create_at = db.Column(db.DateTime, nullable=False)
    last_t = db.Column(db.DateTime, nullable=False)
    last_u = db.Column(db.String(20, collation='NOCASE'))

    def __init__(self, param):
        if 'school_id' in param:
            self.school_id = param['school_id']
        self.code = param['code'] if 'code' in param else self.create_no()
        if 'class_id' in param:
            self.class_id = param['class_id']
        if 'teacher_id' in param:
            self.teacher_id = param['teacher_id']
        if 'date' in param and param['date'] != '':
            self.date = datetime.datetime.strptime(param['date'], '%Y-%m-%d')
        if 'time' in param:
            self.time = param['time']
        if 'total' in param and param['total'] != '':
            self.total = param['total']
        if 'come' in param and param['come'] != '':
            self.come = param['come']
        if 'absent' in param and param['absent'] != '':
            self.absent = param['absent']
        if 'rate' in param and param['rate'] != '':
            self.rate = param['rate']
        if 'class_hours' in param and param['class_hours'] != '':
            self.class_hours = param['class_hours']
        if 'remark' in param:
            self.remark = param['remark']
        self.company_id = param['company_id'] if 'company_id' in param else g.user.company_id
        self.recorder = param['recorder'] if 'recorder' in param else g.user.name
        self.create_at = datetime.datetime.today()
        self.last_t = self.create_at
        self.last_u = g.user.name

    def update(self, param):
        if 'teacher_id' in param:
            self.teacher_id = param['teacher_id']
        if 'date' in param and param['date'] != '':
            self.date = datetime.datetime.strptime(param['date'], '%Y-%m-%d')
        if 'time' in param:
            self.time = param['time']
        if 'total' in param:
            self.total = param['total'] if param['total'] != '' else None
        if 'come' in param:
            self.come = param['come'] if param['come'] != '' else None
        if 'absent' in param:
            self.absent = param['absent'] if param['absent'] != '' else None
        if 'rate' in param:
            self.rate = param['rate'] if param['rate'] != '' else None
        if 'class_hours' in param:
            self.class_hours = param['class_hours'] if param['class_hours'] != '' else None
        if 'remark' in param:
            self.remark = param['remark']
        self.last_t = datetime.datetime.today()
        self.last_u = g.user.name

    def create_no(self):
        if self.school_id is None:
            raise Exception('Please input school_id first!')
        school_no = DanceSchool.get_no(self.school_id)
        if school_no == -1:
            raise Exception('school id [%s] error.' % self.school_id)
        search_no = dc_gen_code(school_no, 'KQ')
        r = DanceCheckIn.query.filter(DanceCheckIn.code.like('%' + search_no + '%'))\
            .order_by(DanceCheckIn.id.desc()).first()
        number = 1 if r is None else int(r.code.rsplit('-', 1)[1]) + 1
        self.code = search_no + ('%03d' % number)
        return self.code

    def __repr__(self):
        return '<CheckIn %r>' % self.id


class DanceCheckInItem(db.Model):
    """班级考勤明细表——考勤本班学员"""
    id = db.Column(db.Integer, primary_key=True)
    chk_id = db.Column(db.Integer, index=True, nullable=False)
    student_id = db.Column(db.Integer, nullable=False)
    is_attend = db.Column(db.SmallInteger, nullable=False)  # 是否出勤
    is_usefee = db.Column(db.SmallInteger, nullable=False)  # 是否扣除课时费
    chk_time = db.Column(db.DateTime)   # 考勤时间
    fee = db.Column(db.Float)   # 学员课时/次费
    rest_fee = db.Column(db.Float)  # 剩余课次
    reason = db.Column(db.String(20, collation='NOCASE'))   # 缺勤原因
    is_fill = db.Column(db.SmallInteger)  # 是否已补课
    fill_date = db.Column(db.DateTime)  # 补课日期
    company_id = db.Column(db.Integer, index=True,  nullable=False)
    recorder = db.Column(db.String(20, collation='NOCASE'))
    remark = db.Column(db.String(20, collation='NOCASE'))
    rest_times = db.Column(db.SmallInteger)  # 剩余课次

    def __init__(self, param):
        self.chk_id = param['chk_id']
        self.student_id = param['student_id']
        self.is_attend = param['is_attend']
        self.is_usefee = param['is_usefee']
        if 'chk_time' in param and param['chk_time'] != '':
            self.chk_time = datetime.datetime.strptime(param['chk_time'], '%Y-%m-%d %H:%M')
        if 'fee' in param:
            self.fee = param['fee']
        if 'rest_fee' in param:
            self.rest_fee = param['rest_fee']
        if 'reason' in param:
            self.reason = param['reason']
        if 'is_fill' in param:
            self.is_fill = param['is_fill']
        if 'fill_date' in param and param['fill_date'] != '':
            self.fill_date = datetime.datetime.strptime(param['fill_date'], '%Y-%m-%d')
        self.company_id = param['company_id'] if 'company_id' in param else g.user.company_id
        self.recorder = param['recorder'] if 'recorder' in param else g.user.name
        if 'remark' in param:
            self.remark = param['remark']
        if 'rest_times' in param and param['rest_times'] != '':
            self.rest_times = param['rest_times']

    def update(self, param):
        self.student_id = param['student_id']
        self.is_attend = param['is_attend']
        self.is_usefee = param['is_usefee']
        if 'chk_time' in param:
            if param['chk_time'] != '':
                self.chk_time = datetime.datetime.strptime(param['chk_time'], '%Y-%m-%d %H:%M')
            else:
                self.chk_time = None
        if 'fee' in param:
            self.fee = param['fee']
        if 'rest_fee' in param:
            self.rest_fee = param['rest_fee']
        if 'reason' in param:
            self.reason = param['reason']
        if 'is_fill' in param:
            self.is_fill = param['is_fill']
        if 'fill_date' in param:
            if param['fill_date'] != '':
                self.fill_date = datetime.datetime.strptime(param['fill_date'], '%Y-%m-%d')
            else:
                self.fill_date = None
        if 'remark' in param:
            self.remark = param['remark']
        if 'rest_times' in param and param['rest_times'] != '':
            self.rest_times = param['rest_times']

    def __repr__(self):
        return '<CheckInItem %r>' % self.id


class DanceCheckInOth(db.Model):
    """班级考勤明细表——考勤其他班学员"""
    id = db.Column(db.Integer, primary_key=True)
    chk_id = db.Column(db.Integer, index=True, nullable=False)
    student_id = db.Column(db.Integer, nullable=False)
    is_attend = db.Column(db.SmallInteger, nullable=False)  # 是否出勤
    is_usefee = db.Column(db.SmallInteger, nullable=False)  # 是否扣除课时费
    chk_time = db.Column(db.DateTime)   # 考勤时间
    fee = db.Column(db.Float)   # 学员课时/次费
    rest_fee = db.Column(db.Float)  # 剩余课次
    company_id = db.Column(db.Integer, index=True,  nullable=False)
    recorder = db.Column(db.String(20, collation='NOCASE'))
    remark = db.Column(db.String(20, collation='NOCASE'))
    rest_times = db.Column(db.SmallInteger)  # 剩余课次

    def __init__(self, param):
        self.chk_id = param['chk_id']
        self.student_id = param['student_id']
        self.is_attend = param['is_attend']
        self.is_usefee = param['is_usefee']
        if 'chk_time' in param and param['chk_time'] != '':
            self.chk_time = datetime.datetime.strptime(param['chk_time'], '%Y-%m-%d %H:%M')
        if 'fee' in param:
            self.fee = param['fee']
        if 'rest_fee' in param:
            self.rest_fee = param['rest_fee']
        self.company_id = param['company_id'] if 'company_id' in param else g.user.company_id
        self.recorder = param['recorder'] if 'recorder' in param else g.user.name
        if 'remark' in param:
            self.remark = param['remark']
        if 'rest_times' in param and param['rest_times'] != '':
            self.rest_times = param['rest_times']

    def update(self, param):
        self.student_id = param['student_id']
        self.is_attend = param['is_attend']
        self.is_usefee = param['is_usefee']
        if 'chk_time' in param:
            if param['chk_time'] != '':
                self.chk_time = datetime.datetime.strptime(param['chk_time'], '%Y-%m-%d %H:%M')
            else:
                self.chk_time = None
        if 'fee' in param:
            self.fee = param['fee']
        if 'rest_fee' in param:
            self.rest_fee = param['rest_fee']
        if 'remark' in param:
            self.remark = param['remark']
        if 'rest_times' in param and param['rest_times'] != '':
            self.rest_times = param['rest_times']

    def __repr__(self):
        return '<CheckInOth %r>' % self.id
