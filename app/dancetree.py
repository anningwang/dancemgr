# -*- coding:utf-8 -*-
from flask import request, jsonify, g
from flask_login import login_required
from app import app, db
from models import DanceSchool, DanceUser, DanceUserSchool


@app.route('/dance_tree_school', methods=['POST', 'GET'])
@login_required
def dance_tree_school():
    tree = [{"id": 1000, "text": "班级信息", 'attributes': {'school_id': 'all', 'is_ended': 0}},
            {"id": 2000, "text": "课程表"},
            {"id": 3000, "text": "教室列表"}
            ]
    t1_class_id = 1000
    school_ids, school_map = DanceUserSchool.get_school_map_by_uid()
    if len(school_ids) == 1:
        t1_2_class_id = t1_class_id * 10
        t1_2_class = [{'id': t1_2_class_id + 1, 'text': '已结束班级',
                       'attributes': {'school_id': 'all', 'is_ended': 1}},
                      {'id': t1_2_class_id + 2, 'text': '全部班级',
                       'attributes': {'school_id': 'all'}}
                      ]
        tree[0]['children'] = t1_2_class
    elif len(school_ids) > 1:
        t1_2_class = []
        for i in range(len(school_ids)):
            t1_2_class_id = t1_class_id*10+i+1
            t1_3_class = [{'id': t1_2_class_id*10+1, 'text': '已结束班级',
                           'attributes': {'school_id': school_ids[i], 'is_ended': 1}},
                          {'id': t1_2_class_id*10+2, 'text': '全部班级',
                           'attributes': {'school_id': school_ids[i]}}
                          ]
            t1_2_class.append({'id': t1_2_class_id, 'text': school_map[school_ids[i]],
                               'attributes': {'school_id': school_ids[i], 'is_ended': 0},
                               'state': 'closed', 'children': t1_3_class})
            tree[0]['children'] = t1_2_class
        # tree[0]['state'] = 'closed'

    return jsonify(tree)


@app.route('/dance_tree_student', methods=['POST', 'GET'])
@login_required
def dance_tree_student():
    tree = [{"id": 1000, "text": "学员列表", 'attributes': {'school_id': 'all', 'is_training': u'是'}},
            {"id": 2000, "text": "准学员列表"},
            {"id": 3000, "text": "收费单（学费）"},
            {"id": 4000, "text": "收费单（演出）"},
            {"id": 5000, "text": "收费单（普通）"},
            {"id": 6000, "text": "班级学员统计", 'attributes': {'school_id': 'all', 'is_ended': 0}}
            ]

    t1_stu_id = 1000
    t6_statstu_id = 6000
    school_ids, school_map = DanceUserSchool.get_school_map_by_uid()
    if len(school_ids) == 1:
        t1_2_stu_id = t1_stu_id * 10
        t1_2_stu = [{'id': t1_2_stu_id + 1, 'text': '流失学员',
                     'attributes': {'school_id': 'all', 'is_training': u'否'}},
                    {'id': t1_2_stu_id + 2, 'text': '全部学员',
                     'attributes': {'school_id': 'all'}}
                    ]
        tree[0]['children'] = t1_2_stu
    elif len(school_ids) > 1:
        t1_2_stu = []
        t6_2_statstu = []
        for i in range(len(school_ids)):
            t1_2_stu_id = t1_stu_id * 10 + i + 1
            t1_3_stu = [{'id': t1_2_stu_id*10+1, 'text': '流失学员',
                         'attributes': {'school_id': school_ids[i], 'is_training': u'否'}},
                        {'id': t1_2_stu_id*10+2, 'text': '全部学员',
                         'attributes': {'school_id': school_ids[i]}}
                        ]
            t1_2_stu.append({'id': t1_2_stu_id, 'text': school_map[school_ids[i]],
                             'attributes': {'school_id': school_ids[i], 'is_training': u'是'},
                             'state': 'closed', 'children': t1_3_stu})

            t6_2_statstu_id = t6_statstu_id * 10 + i + 1
            '''
            t6_3_statstu = [{'id': t6_2_statstu_id * 10 + 1, 'text': '已结束班级',
                             'attributes': {'school_id': school_ids[i], 'is_ended': 1}},
                            {'id': t6_2_statstu_id * 10 + 2, 'text': '全部班级',
                             'attributes': {'school_id': school_ids[i]}}
                            ]
            '''
            t6_2_statstu.append({'id': t6_2_statstu_id, 'text': school_map[school_ids[i]],
                                 'attributes': {'school_id': school_ids[i], 'is_ended': 0}})
        tree[0]['children'] = t1_2_stu
        tree[5]['children'] = t6_2_statstu
        # tree[0]['state'] = 'closed'

    return jsonify(tree)
