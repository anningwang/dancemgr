# -*- coding:utf-8 -*-
from flask_uploads import UploadSet, IMAGES, configure_uploads
from flask import request, redirect, url_for, render_template
from app import app
import os
from config import basedir

app.config['UPLOADED_PHOTO_DEST'] = os.path.join(basedir, "app/uploads")
app.config['UPLOADED_PHOTO_ALLOW'] = IMAGES
app.config['MAX_CONTENT_LENGTH'] = 1 * 1024 * 1024

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


@app.route('/photo/<name>')
def show(name):
    if name is None:
        return render_template('404.html')

    url = photos.url(name)
    return render_template('show.html', url=url, name=name)
