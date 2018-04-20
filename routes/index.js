module.exports = function(app) {
  app.get('/', function(req, res) {
    res.redirect('/posts');   // 重定向
  });
  app.use('/signup', require('./signup'));
  app.use('/signin', require('./signin'));
  app.use('/signout', require('./signout'));
  app.use('/posts', require('./posts'));
  app.use('/comments', require('./comments'));
  // 404 page
  app.use(function(req, res) {
    // res.headersSent （ 如果响应头已被发送则为 true，否则为 false ）
    if (!res.headersSent) {
      res.status(404).render('404');
    }
  });
}
