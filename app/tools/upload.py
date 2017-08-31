# -*- coding:utf-8 -*-
from flask_uploads import UploadSet, IMAGES, configure_uploads
from flask import request, redirect, url_for, render_template, jsonify
from app import app
import os
from config import basedir
from werkzeug.utils import secure_filename
import base64
import time


app.config['UPLOADED_PHOTO_DEST'] = os.path.join(basedir, "app/uploads")
app.config['UPLOADED_PHOTO_ALLOW'] = IMAGES
app.config['MAX_CONTENT_LENGTH'] = 1 * 1024 * 1024

UPLOAD_FOLDER='uploads'
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
    file_dir = os.path.join(basedir, app.config['UPLOAD_FOLDER'])
    if not os.path.exists(file_dir):
        os.makedirs(file_dir)
    f = request.files['uploadExcel']     # 从表单的file字段获取文件，uploadExcel为该表单的name值
    if f and allowed_file(f.filename):  # 判断是否是允许上传的文件类型
        fname = secure_filename(f.filename)
        print fname
        ext = fname.rsplit('.', 1)[1]    # 获取文件后缀
        unix_time = int(time.time())
        new_filename = str(unix_time)+'.'+ext   # 修改了上传的文件名
        f.save(os.path.join(file_dir, new_filename))     # 保存文件到upload目录
        token = base64.b64encode(new_filename)
        print token
        return jsonify({"errorCode": 0, "msg": "上传成功", "token": token})
    else:
        return jsonify({"errorCode": 1001, "msg": "上传失败"})


@app.route('/photo/<name>')
def show(name):
    if name is None:
        return render_template('404.html')

    url = photos.url(name)
    return render_template('show.html', url=url, name=name)
