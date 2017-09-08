# -*- coding:utf-8 -*-
from flask_uploads import UploadSet, IMAGES, configure_uploads
from flask import request, redirect, url_for, render_template, jsonify, send_from_directory, abort
from app import app
import os
from config import basedir
from werkzeug.utils import secure_filename
import base64
import time
from excel import *
from tools import get_filename


app.config['UPLOADED_PHOTO_DEST'] = os.path.join(basedir, "app/uploads")
app.config['UPLOADED_PHOTO_ALLOW'] = IMAGES
app.config['MAX_CONTENT_LENGTH'] = 1 * 1024 * 1024

UPLOAD_FOLDER = 'app/uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# ALLOWED_EXTENSIONS = set(['txt','png','jpg','xls','JPG','PNG','xlsx','gif','GIF'])
ALLOWED_EXTENSIONS = ['txt', 'png', 'jpg', 'xls', 'JPG', 'PNG', 'xlsx', 'gif', 'GIF']


def allowed_file(filename):
    # 用于判断文件后缀
    return '.' in filename and filename.rsplit('.', 1)[1] in ALLOWED_EXTENSIONS


# 实例化 UploadSet 对象
photos = UploadSet('PHOTO')

# 将 app 的 config 配置注册到 UploadSet 实例 photos
configure_uploads(app, photos)


@app.route('/upload', methods=['POST', 'GET'])
def upload():
    if request.method == 'POST' and 'photo' in request.files:
        filename = photos.save(request.files['photo'])
        return redirect(url_for('show', name=filename))
    return render_template('upload.html')


@app.route('/api/upload', methods=['POST'], strict_slashes=False)
def api_upload():
    dance_module_name = request.form['danceModuleName']
    file_dir = os.path.join(basedir, app.config['UPLOAD_FOLDER'])
    if not os.path.exists(file_dir):
        os.makedirs(file_dir)
    f = request.files['uploadExcel']     # 从表单的file字段获取文件，uploadExcel为该表单的name值
    if f and allowed_file(f.filename):  # 判断是否是允许上传的文件类型
        fname = secure_filename(f.filename)
        print fname
        ext = fname.rsplit('.', 1)[1]    # 获取文件后缀
        time_tick = int(time.time())
        new_filename = str(time_tick)+'.'+ext   # 修改了上传的文件名
        new_fn_dir = os.path.join(file_dir, new_filename)
        f.save(new_fn_dir)     # 保存文件到upload目录
        token = base64.b64encode(new_filename)
        print token
        return jsonify(dispatch_import_file(new_fn_dir, dance_module_name))
    else:
        return jsonify({"errorCode": 1001, "msg": "上传失败！"})


@app.route('/api/download', methods=['POST', 'GET'])
def api_download():
    if request.method == "POST":
        dance_module_name = request.form['danceModuleName']
        file_dir = os.path.join(basedir, app.config['UPLOAD_FOLDER'])

        if dance_module_name == 'danceStudent':
            sheet_name = u'报名登记'
            filename = get_filename(sheet_name)
            path_fn = os.path.join(file_dir, filename)

            err, msg = student_export_from_db(path_fn, sheet_name)

            if err == 0:
                return jsonify({"errorCode": 0, "msg": "导出成功！", 'url': photos.url(filename)})
        else:
            return jsonify({"errorCode": 1002, "msg": u"Unknown module name[%s]" % dance_module_name})

    return jsonify({"errorCode": 1001, "msg": "接口错误，只支持POST！"})

'''
@app.route('/api/download/<filename>', methods=['GET'])
def download(filename):
    if request.method == "GET":
        file_dir = os.path.join(basedir, app.config['UPLOAD_FOLDER'])
        if os.path.isfile(os.path.join(file_dir, filename)):
            # return send_from_directory(file_dir, filename, as_attachment=True)
            filepath = os.path.join(basedir, 'app/static/img/favicon.ico')
            filepath = 'img/favicon.icon'
            return app.send_static_file(filepath)
    abort(404)
'''


@app.route('/photo/<name>')
def show(name):
    if name is None:
        return render_template('404.html')

    url = photos.url(name)
    return render_template('show.html', url=url, name=name)


def dispatch_import_file(fn, dance_module_name):
    if dance_module_name == 'danceStudent':
        dict_data, msg, correct_num, wrong_num = student_import_to_db(fn)
        dict_data2, msg2, correct_num2, wrong_num2 = student_class_import_to_db(fn, u'报班——选择班级')
        if msg == 'ok' and msg2 == 'ok':
            return {'errorCode': 0, 'msg': u'上传成功！', 'correctNum': correct_num, 'wrongNum': wrong_num}
        else:
            return {'errorCode': 200, 'msg': msg + msg2, 'correctNum': correct_num, 'wrongNum': wrong_num}
    elif dance_module_name == 'danceClass':
        dict_data, msg, correct_num, wrong_num = class_import_to_db(fn)
        if msg == 'ok':
            return {'errorCode': 0, 'msg': u'上传成功！', 'correctNum': correct_num, 'wrongNum': wrong_num}
        else:
            return {'errorCode': 200, 'msg': msg, 'correctNum': correct_num, 'wrongNum': wrong_num}
    else:
        return {'errorCode': 201, 'msg': u'Unknown module name %s' % dance_module_name,
                'correctNum': 0, 'wrongNum': 0}
