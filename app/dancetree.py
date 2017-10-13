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
            {"id": 50, "text": "收费单（普通）", 'attributes': {'school_id': 'all'}},
            {"id": 60, "text": "班级学员统计", 'attributes': {'school_id': 'all', 'is_ended': 0}}
            ]

    school_ids, school_map = DanceUserSchool.get_school_map_by_uid()
    if len(school_ids) == 1:
        t1 = [{'text': '流失学员', 'attributes': {'school_id': 'all', 'is_training': u'否'}},
              {'text': '全部学员', 'attributes': {'school_id': 'all'}} ]
        tree[0]['children'] = t1
    elif len(school_ids) > 1:
        t1 = []
        t3, t4, t5 = [], [], []
        t6 = []
        for i in range(len(school_ids)):
            name = school_map[school_ids[i]]
            sid = school_ids[i]
            t11 = [{'text': '流失学员', 'attributes': {'school_id': sid, 'is_training': u'否'}},
                   {'text': '全部学员',  'attributes': {'school_id': sid}}]
            t1.append({'text': name, 'state': 'closed', 'children': t11,
                       'attributes': {'school_id': sid, 'is_training': u'是'}})

            t3.append({'text': name, 'attributes': {'school_id': sid}})

            t6.append({'text': name, 'attributes': {'school_id': sid, 'is_ended': 0}})

        tree[0]['children'] = t1
        tree[2]['children'] = t3
        tree[3]['children'] = t3
        tree[4]['children'] = t3
        tree[5]['children'] = t6

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
            {"id": 20, "text": "课程表"},
            {"id": 30, "text": "教室列表"}
            ]

    if len(school_ids) == 1:
        t1 = [{'text': '已结束班级', 'attributes': {'school_id': 'all', 'is_ended': 1}},
              {'text': '全部班级', 'attributes': {'school_id': 'all'}}]
        tree[0]['children'] = t1
    elif len(school_ids) > 1:
        t1 = []
        for i in range(len(school_ids)):
            name = school_map[school_ids[i]]
            sid = school_ids[i]

            t11 = [{'text': '已结束班级', 'attributes': {'school_id': sid, 'is_ended': 1}},
                   {'text': '全部班级', 'attributes': {'school_id': sid}}]
            t1.append({'text': name, 'state': 'closed', 'children': t11,
                       'attributes': {'school_id': sid, 'is_ended': 0}})

            tree[0]['children'] = t1
        # tree[0]['state'] = 'closed'

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
                {"id": 510, "text": "表格测试"}
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
    tree = [
        {"id": 1, "text": "退费单（学费）列表" },
        {"id": 2, "text": "房租" }
    ]
    return tree
