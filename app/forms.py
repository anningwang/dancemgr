# -*- coding:utf-8 -*-
from flask_wtf import FlaskForm
from wtforms import StringField, BooleanField, TextAreaField, PasswordField, validators
from wtforms.validators import DataRequired, Length
from flask_babel import gettext
from app.models import User


class LoginForm(FlaskForm):
    openid = StringField('openid', validators=[DataRequired()])
    remember_me = BooleanField('remember_me', default=False)


class EditForm(FlaskForm):
    nickname = StringField('nickname', validator=[DataRequired()])
    about_me = TextAreaField('about_me', validators=[Length(min=0, max=140)])
    
    def __init__(self, original_nickname, *args, **kwargs):
        FlaskForm.__init__(self, *args, **kwargs)
        self.original_nickname = original_nickname
        
    def validate(self):
        if not FlaskForm.validate(self):
            return False
        if self.nickname.data == self.original_nickname:
            return True
        if self.nickname.data != User.make_valid_nickname(self.nickname.data):
            self.nickname.errors.append(gettext('This nickname has invalid characters. Please use letters, numbers, dots and underscores only.'))
            return False
        user = User.query.filter_by(nickname = self.nickname.data).first()
        if user is not None:
            self.nickname.errors.append(gettext('This nickname is already in use. Please choose another one.'))
            return False
        return True


class PostForm(FlaskForm):
    post = StringField('post', validators=[DataRequired()])


class SearchForm(FlaskForm):
    search = StringField('search', validators=[DataRequired()])


# get JoySuch's Token
class TokenForm(FlaskForm):
    token = StringField('token')


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
