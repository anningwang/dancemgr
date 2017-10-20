# -*- coding:utf-8 -*-
from flask_wtf import FlaskForm
from wtforms import StringField, BooleanField, PasswordField, validators
from wtforms.validators import DataRequired, Length


class DanceLoginForm(FlaskForm):
    username = StringField('username', validators=[DataRequired()])
    password = StringField('password', validators=[DataRequired()])
    remember_me = BooleanField('remember_me', default=False)


class DanceRegistrationForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(min=2, max=20)])
    email = StringField('Email Address', [validators.Length(min=6, max=35)])
    password = PasswordField('New Password', [
        validators.DataRequired(),
        validators.EqualTo('confirm_pwd', message=u'两次输入的密码必须相同')
    ])
    confirm_pwd = PasswordField('Repeat Password')
    company = StringField('Company', validators=[DataRequired()])
