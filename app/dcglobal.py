# -*- coding:utf-8 -*-
from enum import Enum, unique


@unique
class FeeItemType(Enum):
    # 收费项目 类别 type: 1 学费， 2 演出费， 3，普通收费
    Study = 1
    Show = 2
    Common = 3


def get_feename(t):
    _t = FeeItemType(int(t))
    if _t == FeeItemType.Common:
        return u'普通收费'
    elif _t == FeeItemType.Show:
        return u'演出费'
    elif _t == FeeItemType.Study:
        return u'学费'
    else:
        return u'[未知](%d)' % t
