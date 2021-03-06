const express = require('express');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const flash = require('connect-flash');   // 消息通知中间件
// 读取配置文件 | 默认加载 ./config/default.js
const config = require('config-lite')(__dirname);

const routes = require('./routes');   // 默认加载 index.js
const pkg = require('./package');   // 加载 ./package.json
// 用于日志模块
const winston = require('winston');
const expressWinston = require('express-winston');

const app = express();
// 设置模板目录
app.set('views', path.join(__dirname, 'views'));
// 设置模板引擎为 ejs
app.set('view engine', 'ejs');

// 设置静态文件目录
app.use(express.static(path.join(__dirname, 'public')));
// session 中间件
app.use(session({
  name: config.session.key,   // 设置 cookie 中保存 session id 的字段名称
  secret: config.session.secret,   // 通过设置 secret 来计算 hash 值并放在 cookie 中，使产生的 signedCookie 防篡改
  resave: true,   // 强制更新 session
  saveUninitialized: false,   // 设置为 false，强制创建一个 session，即使用户未登录
  cookie: {
    maxAge: config.session.maxAge   // 过期时间，过期后 cookie 中的 session id 自动删除 | 单位（毫秒）
  },
  store: new MongoStore({   // 将 session 存储到 mongodb
    url: config.mongodb   // mongodb 地址
  })
}));

// flash 中间件，用来显示通知
app.use(flash());
// 处理表单及文件上传的中间件
app.use(require('express-formidable')({
  uploadDir: path.join(__dirname, 'public/img'),   // 上传文件到此目录
  keepExtensions: true   // 保留后缀
}));

// app.locals 上通常挂载常量信息
app.locals.blog = {
  title: pkg.name,
  description: pkg.description
};
// res.locals 上通常挂载变量信息
app.use(function(req, res, next) {
  res.locals.user = req.session.user;
  res.locals.success = req.flash('success').toString();
  res.locals.error = req.flash('error').toString();
  next();
});

// 正常请求的日志
app.use(expressWinston.logger({
  transports: [
    new winston.transports.Console({
      json: true,
      colorize: true
    }),
    new winston.transports.File({
      filename: 'logs/success.log'
    })
  ]
}));

// 路由
routes(app);

// 错误请求的日志
app.use(expressWinston.errorLogger({
  transports: [
    new winston.transports.Console({
      json: true,
      colorize: true
    }),
    new winston.transports.File({
      filename: 'logs/error.log'
    })
  ]
}));

app.use(function(error, req, res, next) {
  console.log(error);
  req.flash('error', error.message);
  res.redirect('/posts');
});

if (module.parent) {
  // 被 require，则导出 app （通常用于测试）
  module.exports = app;
} else {
  // 监听端口，启动程序
  app.listen(config.port, function() {
    console.log(`${ pkg.name } listening on port ${ config.port }...`);
  });
}
