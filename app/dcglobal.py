# -*- coding:utf-8 -*-
from enum import Enum, unique


@unique
class FeeItemType(Enum):
    # 收费项目 类别 type: 1 学费， 2 演出， 3，普通
    Study = 1
    Show = 2
    Common = 3
