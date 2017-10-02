# -*- coding:utf-8 -*-
from flask import jsonify
from flask_login import login_required
from app import app
from models import DanceUserSchool


@app.route('/dance_tree_school', methods=['POST', 'GET'])
@login_required
def dance_tree_school():
    tree = [{"id": 10, "text": "班级信息", 'attributes': {'school_id': 'all', 'is_ended': 0}},
            {"id": 20, "text": "课程表"},
            {"id": 30, "text": "教室列表"}
            ]

    school_ids, school_map = DanceUserSchool.get_school_map_by_uid()
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

    return jsonify(tree)


@app.route('/dance_tree_student', methods=['POST', 'GET'])
@login_required
def dance_tree_student():
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

    return jsonify(tree)
