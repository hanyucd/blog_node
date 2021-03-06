const express = require('express');
const router = express.Router();
const sha1 = require('sha1');

const checkNotLogin = require('../middlewares/check').checkNotLogin;
const UserModel = require('../models/users');

// GET /signin 登录页
router.get('/', checkNotLogin, function(req, res, next) {
  res.render('signin');
});

// POST /signin 用户登录
router.post('/', checkNotLogin, function(req, res, next) {
  const name = req.fields.name;
  const password = req.fields.password;

  // 校验参数
  try {
    if (!name.length) {
      throw new Error('请填写用户名 ！');
    }
    if (!password.length) {
      throw new Error('请填写密码 ！');
    }
  } catch (error) {
    req.flash('error', error.message);
    return res.redirect('back');   // 返回上一页
  }

  UserModel.getUserByName(name).then(function(user) {
    if (!user) {
      req.flash('error', '用户不存在 ！');
      return res.redirect('back');
    }
    // 检查密码是否匹配
    if (sha1(password) !== user.password) {
      req.flash('error', '用户名或密码错误 ！');
      return res.redirect('back');
    }
    req.flash('success', '登录成功 ！');
    delete user.password;   // 删除密码
    req.session.user = user;   // 用户信息写入 session
    res.redirect('/posts');
  }).catch(next);
});

module.exports = router;
