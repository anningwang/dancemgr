# -*- coding:utf-8 -*-
from flask import jsonify
from flask_login import login_required
from app import app
from models import DanceUserSchool


@app.route('/api/dance_tree_get', methods=['POST', 'GET'])
@login_required
def api_dance_tree_get():
    tree = [{"id": 10, "text": "学员列表", 'attributes': {'school_id': 'all', 'is_training': u'是'}},
            {"id": 20, "text": "准学员列表"},
            {"id": 30, "text": "收费单（学费）", 'attributes': {'school_id': 'all'}},
            {"id": 40, "text": "收费单（演出）", 'attributes': {'school_id': 'all'}},
            {"id": 50, "text": "收费单（考级）", 'attributes': {'school_id': 'all'}},
            {"id": 60, "text": "班级学员统计", 'attributes': {'school_id': 'all', 'is_ended': 0}},
            {"id": 70, "text": "集体续班", 'attributes': {'school_id': 'all'}, 'state': 'closed'},
            {"id": 80, "text": "班级考勤", 'attributes': {'school_id': 'all'}, 'state': 'closed'},
            {"id": 90, "text": "收费月统计", 'attributes': {'school_id': 'all'}, 'state': 'closed'}
            ]

    school_ids, school_map = DanceUserSchool.get_school_map_by_uid()

    sid = 'all'
    l1 = [{'text': '流失学员', 'attributes': {'school_id': sid, 'is_training': u'否'}},
          {'text': '全部学员', 'attributes': {'school_id': sid}}]
    v3 = 301001
    l3 = [{'text': '今日收费', 'attributes': {'school_id': sid, 'date': 'today'}},
          {'text': '昨日收费', 'attributes': {'school_id': sid}},
          {'text': '本周收费', 'attributes': {'school_id': sid}},
          {'text': '上周收费', 'attributes': {'school_id': sid}},
          {'text': '本月收费', 'attributes': {'school_id': sid}},
          {'text': '上月收费', 'attributes': {'school_id': sid}},
          {'id': v3, 'text': '按年月查询', 'attributes':
              {'school_id': sid, 'module': 'receiptStudy'}}
          ]

    if len(school_ids) == 1:
        tree[0]['children'] = l1
        tree[2]['children'] = l3
    elif len(school_ids) > 1:
        t1, t3, t4, t5, t6, t7, t8, t9 = [], [], [], [], [], [], [], []
        for i in range(len(school_ids)):
            name = school_map[school_ids[i]]
            sid = school_ids[i]
            l1 = [{'text': '流失学员', 'attributes': {'school_id': sid, 'is_training': u'否'}},
                  {'text': '全部学员', 'attributes': {'school_id': sid}}]
            t1.append({'text': name, 'state': 'closed', 'children': l1,
                       'attributes': {'school_id': sid, 'is_training': u'是'}})

            v3 += i
            l3 = [{'text': '今日收费', 'attributes': {'school_id': sid, 'date': 'today'}},
                  {'text': '昨日收费', 'attributes': {'school_id': sid}},
                  {'text': '本周收费', 'attributes': {'school_id': sid}},
                  {'text': '上周收费', 'attributes': {'school_id': sid}},
                  {'text': '本月收费', 'attributes': {'school_id': sid}},
                  {'text': '上月收费', 'attributes': {'school_id': sid}},
                  {'id': v3, 'text': '按年月查询', 'attributes':
                      {'school_id': sid, 'module': 'receiptStudy'}}
                  ]
            t3.append({'text': name,  'state': 'closed', 'children': l3, 'attributes': {'school_id': sid}})
            t4.append({'text': name, 'attributes': {'school_id': sid}})
            t5.append({'text': name, 'attributes': {'school_id': sid}})
            t6.append({'text': name, 'attributes': {'school_id': sid, 'is_ended': 0}})
            t7.append({'text': name, 'attributes': {'school_id': sid}})
            t8.append({'text': name, 'attributes': {'school_id': sid}})
            t9.append({'text': name, 'attributes': {'school_id': sid}})

        t5.append({'id': 5001, 'text': '考级信息', 'attributes': {'school_id': 'all'}})

        tree[0]['children'] = t1
        tree[2]['children'] = t3
        tree[3]['children'] = t4
        tree[4]['children'] = t5
        tree[5]['children'] = t6
        tree[6]['children'] = t7
        tree[7]['children'] = t8
        tree[8]['children'] = t9

        tree[2]['state'] = 'closed'
        tree[3]['state'] = 'closed'
        tree[4]['state'] = 'closed'
        tree[5]['state'] = 'closed'

    db_tree = dance_tree_db()
    teacher_tree = dance_tree_teacher(school_ids, school_map)
    school_tree = dance_tree_school(school_ids, school_map)
    asset_tree = dance_tree_asset()
    finance_tree = dance_tree_finance()
    return jsonify({'stu': tree,
                    'db': db_tree,
                    'teacher': teacher_tree,
                    'school': school_tree,
                    'asset': asset_tree,
                    'finance': finance_tree,
                    'errorCode': 0, 'msg': 'ok'})


def dance_tree_school(school_ids, school_map):
    tree = [{"id": 10, "text": "班级信息", 'attributes': {'school_id': 'all', 'is_ended': 0}},
            {"id": 20, "text": "课程表", "children": [
                {"id": 2001, "text": "课程表列表", 'attributes': {'showList': 1}}
            ]},
            {"id": 30, "text": "教室列表", 'attributes': {'school_id': 'all'}},
            {"id": 40, "text": "记事本", 'attributes': {'school_id': 'all'}}
            ]

    if len(school_ids) == 1:
        t1 = [{'text': '已结束班级', 'attributes': {'school_id': 'all', 'is_ended': 1}},
              {'text': '全部班级', 'attributes': {'school_id': 'all'}}]
        tree[0]['children'] = t1
    elif len(school_ids) > 1:
        t1, t3, t4 = [], [], []
        for i in range(len(school_ids)):
            name = school_map[school_ids[i]]
            sid = school_ids[i]

            t11 = [{'text': '已结束班级', 'attributes': {'school_id': sid, 'is_ended': 1}},
                   {'text': '全部班级', 'attributes': {'school_id': sid}}]
            t1.append({'text': name, 'state': 'closed', 'children': t11,
                       'attributes': {'school_id': sid, 'is_ended': 0}})

            t3.append({'text': name,  'attributes': {'school_id': sid}})
            t4.append({'text': name, 'attributes': {'school_id': sid}})
        """对顶层菜单增加子菜单"""
        tree[0]['children'] = t1
        tree[2]['children'] = t3
        tree[3]['children'] = t4

        tree[2]['state'] = 'closed'

    return tree


def dance_tree_teacher(school_ids, school_map):
    tree = [{"id": 10, "text": "员工与老师", 'attributes': {'school_id': 'all', 'in_job': 1}},
            ]

    if len(school_ids) == 1:
        t1 = [{'text': '在职员工与老师', 'attributes': {'school_id': 'all', 'in_job': 1}},
              {'text': '本校全部员工与老师', 'attributes': {'school_id': 'all'}}]
        tree[0]['children'] = t1
    elif len(school_ids) > 1:
        t1 = []
        for i in range(len(school_ids)):
            name = school_map[school_ids[i]]
            sid = school_ids[i]

            t11 = [{'text': '在职员工与老师', 'attributes': {'school_id': sid, 'in_job': 1}},
                   {'text': '本校全部员工与老师', 'attributes': {'school_id': sid}}]
            t1.append({'text': name, 'state': 'closed', 'children': t11,
                       'attributes': {'school_id': sid, 'in_job': 1}})
        t1.append({'text': '所有分校员工与老师', 'attributes': {'school_id': 'all'}})
        tree[0]['children'] = t1
        # tree[0]['state'] = 'closed'

    return tree


def dance_tree_db():
    tree = [{"id": 1, "text": "数据库备份"},
            {"id": 2, "text": "操作日志"},
            {"id": 3, "text": "分校信息"},
            {"id": 4, "text": "用户管理"},
            {"id": 5, "text": "分校公共信息", "children": [
                {"id": 51, "text": "收费项目"},
                {"id": 52, "text": "教材信息"},
                {"id": 53, "text": "收费方式"},
                {"id": 54, "text": "班级类型"},
                {"id": 55, "text": "文化程度"},
                {"id": 56, "text": "职位信息"},
                {"id": 57, "text": "意向程度"},
                {"id": 58, "text": "信息来源"},
                {"id": 59, "text": "咨询方式"},
                {"id": 510, "text": "表格测试"},
                {"id": 511, "text": "表格行内菜单"},
                {"id": 512, "text": "支出类别"},
                {"id": 513, "text": "收入类别"}
            ]}
            ]
    return tree


def dance_tree_asset():
    tree = [
        {"id": 1, "text": "舞蹈用品列表" },
        {"id": 2, "text": "办公用品列表" }
    ]
    return tree


def dance_tree_finance():
    """ 财务管理 """
    tree = [
        {"id": 1, "text": "退费单（学费）列表", 'attributes': {'school_id': 'all'}},
        {"id": 2, "text": "房租", 'attributes': {'school_id': 'all'}},
        {"id": 3, "text": "其他收入", 'attributes': {'school_id': 'all'}},
        {"id": 4, "text": "其他支出", 'attributes': {'school_id': 'all'}}
    ]

    school_ids, school_map = DanceUserSchool.get_school_map_by_uid()
    if len(school_ids) == 1:
        pass
    elif len(school_ids) > 1:
        t1, t2, t3, t4, = [], [], [], []
        for i in range(len(school_ids)):
            name = school_map[school_ids[i]]
            sid = school_ids[i]
            t1.append({'text': name, 'attributes': {'school_id': sid}})
            t2.append({'text': name, 'attributes': {'school_id': sid}})
            t3.append({'text': name, 'attributes': {'school_id': sid}})
            t4.append({'text': name, 'attributes': {'school_id': sid}})

        tree[0]['children'] = t1
        tree[1]['children'] = t2
        tree[2]['children'] = t3
        tree[3]['children'] = t4

        tree[0]['state'] = 'closed'
        tree[1]['state'] = 'closed'
        tree[2]['state'] = 'closed'
        tree[3]['state'] = 'closed'

    return tree


@app.route('/xxx_get', methods=['POST', 'GET'])
@login_required
def xxx_get():
    """ 表格行内菜单 测试命令 """
    data = []
    for i in range(2):
        data.append({'name': 'row'+str(i), 'oper': 'oper'+str(i), 'mm': 'mm'})
    return jsonify({'rows': data, 'total': len(data), 'errorCode': 0, 'msg': 'ok'})


@app.route('/xxx_query', methods=['POST', 'GET'])
@login_required
def xxx_query():
    """ 表格行内菜单 测试命令 """
    return jsonify([])
