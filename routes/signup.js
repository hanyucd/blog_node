const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const sha1 = require('sha1');   // 使用 SHA-1算法散列消息加密

const checkNotLogin = require('../middlewares/check').checkNotLogin;
const UserModel = require('../models/users');

// GET /signup 注册页
router.get('/', checkNotLogin, function(req, res, next) {
  res.render('signup');
});

// POST /signup 用户注册
router.post('/', checkNotLogin, function(req, res, next) {
  const name = req.fields.name;
  const gender = req.fields.gender;
  const bio = req.fields.bio;
  // path.sep：提供了平台特定的路径片段分隔符
  // pop()：移除数组最后一项并返回移除的项
  const avatar = req.files.avatar.path.split(path.sep).pop();   // result: xxx.jpg
  let password = req.fields.password;
  const repassword = req.fields.repassword;

  // 校验参数
  try {
    if (!(name.length >= 1 && name.length <= 10)) {
      throw new Error('名字限制在 1 - 10 个字符 !');
    }
    if (['m', 'f', 'x'].indexOf(gender) === -1) {
      throw new Error('性别只能是 m、f、x !');
    }
    if (!(bio.length >= 1 && bio.length <= 30)) {
      throw new Error('个人简介请限制在 1-30 个字符 !');
    }
    if (password.length < 6) {
      throw new Error('密码至少 6 个字符 !');
    }
    if (password !== repassword) {
      throw new Error('两次密码输入不一致 !');
    }
  } catch (error) {
    // 注册失败，异步删除上传的头像
    fs.unlink(req.files.avatar.path);  // 异步删除文件
    req.flash('error', error.message);
    return res.redirect('/signup');
  }

  // 明文密码加密
  password = sha1(password);
  // 待写入数据库的用户信息
  let user = {
    name: name,
    password: password,
    gender: gender,
    bio: bio,
    avatar
  };
  // 用户信息写入数据库
  UserModel.create(user).then(function(result) {
    // 此 user 是插入 mongodb 后的值，包含 _id
    user = result.ops[0];
    delete user.password;  // 删除密码这种敏感信息
    req.session.user = user;   // 将用户信息存入 session
    req.flash('success', `注册成功 ! 欢迎用户 ${ user.name } 来到此博客站点 ...`);
    res.redirect('/posts');   // 跳转到首页
  }).catch(function(error) {
    fs.unlink(req.files.avatar.path);   // 注册失败，异步删除上传的头像
    // 用户名被占用则跳回注册页，而不是错误页
    if (error.message.match('duplicate key')) {
      req.flash('error', '用户名已被占用！');
      return res.redirect('/signup');
    }
    next(error);
  });
});

module.exports = router;
