# -*- coding:utf-8 -*-
from flask import request, jsonify, g
from flask_login import login_required
from app import app, db
from models import DanceSchool, DanceUser, DanceUserSchool
import json


@app.route('/dance_tree_school', methods=['POST'])
@login_required
def dance_tree_school():
    tree = [{"id": 1000, "text": "班级信息", 'attributes': {'school_id': 'all', 'is_ended': 0}},
            {"id": 2000, "text": "课程表"},
            {"id": 3000, "text": "教室列表"}
            ]
    class_tid = 1000
    school_ids, school_map = DanceUserSchool.get_school_map_by_uid()
    if len(school_ids) == 1:
        t2_class_id = class_tid * 10 + 1
        t2_class = [{'id': t2_class_id * 10 + 1, 'text': '已结束班级',
                     'attributes': {'school_id': 'all', 'is_ended': 1}},
                    {'id': t2_class_id * 10 + 2, 'text': '全部班级',
                    'attributes': {'school_id': 'all'}
                     }]
        tree[0]['children'] = t2_class
    elif len(school_ids) > 1:
        t2_class = []
        for i in range(len(school_ids)):
            t2_class_id = class_tid*10+i+1
            t3_class = [{'id': t2_class_id*10+1, 'text': '已结束班级',
                         'attributes': {'school_id': school_ids[i], 'is_ended': 1}},
                        {'id': t2_class_id*10+2, 'text': '全部班级',
                         'attributes': {'school_id': school_ids[i]}
                         }]
            t2_class.append({'id': t2_class_id, 'text': school_map[school_ids[i]],
                             'attributes': {'school_id': school_ids[i], 'is_ended': 0},
                             'state': 'closed', 'children': t3_class})
        tree[0]['children'] = t2_class
        # tree[0]['state'] = 'closed'

    return jsonify(tree)
