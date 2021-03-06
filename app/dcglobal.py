# -*- coding:utf-8 -*-
from enum import Enum, unique


@unique
class FeeItemType(Enum):
    # 收费项目类别 type: 1 学费， 2 演出费， 3，普通收费
    Study = 1
    Show = 2
    Common = 3


# 班级是否结束
CLASS_IS_END = 1                # 已结束
CLASS_IS_ON = 0                 # 未结束

DC_YES = u'是'
DC_NO = u'否'

DC_YES_VAL = 1
DC_NO_VAL = 0

# 班级授课形式
CLASS_STYLE_GROUP = 1           # 集体课
CLASS_STYLE_ONE_FOR_ONE = 2     # 1对1

# 学费收费模式
CLASS_MODE_BY_TIMES = 1         # 按课次
CLASS_MODE_BY_HOUR = 2          # 按课时

TEACHER_IN_ALL_SCHOOL = -99     # 员工与老师在所有分校任教

GENDER_MALE = u'男'
GENDER_FEMALE = u'女'
GENDER_MALE_V = 1
GENDER_FEMALE_V = 0

DEGREE_SCOPE_ALL = 1
DEGREE_SCOPE_STUDENT = 2
DEGREE_SCOPE_TEACHER = 3

COMM_TYPE_DEGREE = 2            # 文化程度
COMM_TYPE_JOB_TITLE = 3         # 职位
COMM_TYPE_INFO_SRC = 4          # 信息来源
COMM_TYPE_CONSULT_MODE = 5      # 咨询方式
COMM_TYPE_INTENTION = 6         # 意向程度
COMM_TYPE_EXPENSE = 7           # 支出类别
COMM_TYPE_INCOME = 8            # 收入类别

STU_CLASS_STATUS_NORMAL = u'正常'
STU_CLASS_STATUS_UPG = u'已续班'
STU_CLASS_STATUS_END = u'结束'
STU_CLASS_STATUS_STOP = u'退班'

DANCE_PRECISION = 1e-5


def get_feename(val):
    """ 收费项目类别 """
    _t = FeeItemType(int(val))
    if _t == FeeItemType.Common:
        return u'普通收费'
    elif _t == FeeItemType.Show:
        return u'演出费'
    elif _t == FeeItemType.Study:
        return u'学费'
    else:
        return u'[未知](%s)' % val


def get_class_end(val):
    """ 班级是否结束 """
    if val == CLASS_IS_END:
        return u'已结束'
    elif val == CLASS_IS_ON:
        return u'未结束'
    else:
        return u'[未知](%s)' % val


def get_class_style(val):
    """ 班级授课形式 """
    val = int(val)
    if val == CLASS_STYLE_GROUP:
        return u'集体课'
    elif val == CLASS_STYLE_ONE_FOR_ONE:
        return u'1对1'
    else:
        return u'[未知](%s)' % val


def class_style_val(name):
    """ 班级类型 转 value"""
    if name == u'集体课':
        return CLASS_STYLE_GROUP
    elif name == u'1对1':
        return CLASS_STYLE_ONE_FOR_ONE
    else:
        return CLASS_STYLE_GROUP


def get_class_mode(val):
    """  学费收费模式 """
    val = int(val)
    if val == CLASS_MODE_BY_TIMES:
        return u'按课次'
    elif val == CLASS_MODE_BY_HOUR:
        return u'按课时'
    else:
        return u'[未知](%s)' % val


def class_mode_val(mode):
    """ 学费收费模式 转 value """
    if mode == u'按课次':
        return CLASS_MODE_BY_TIMES
    elif mode == u'按课时':
        return CLASS_MODE_BY_HOUR
    else:
        return CLASS_MODE_BY_TIMES


def gender_v(text):
    return GENDER_MALE_V if text == GENDER_MALE else GENDER_FEMALE_V


def teacher_type_s(val):
    return u'专职' if val else u'兼职'


def degree_scope_s(val):
    if val == DEGREE_SCOPE_ALL:
        return u'两者'
    elif val == DEGREE_SCOPE_STUDENT:
        return u'仅用于学员'
    else:
        return u'仅用于员工与老师'
