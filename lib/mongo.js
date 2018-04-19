const config = require('config-lite')(__dirname);
const Mongolass = require('mongolass');

const mongolass = new Mongolass();
mongolass.connect(config.mongodb);

exports.User = mongolass.model('User', {
  name: { type: 'string', required: true },
  password: { type: 'string', required: true },
  avatar: { type: 'string', required: true },
  gender: { type: 'string', enum: ['m', 'f', 'x'], default: 'x' },
  bio: { type: 'string', required: true }
});
// 根据用户名找到用户，用户名全局唯一
exports.User.index({ name: 1 }, { unique: true }).exec();

const moment = require('moment');
const ObjectIdToTimestamp = require('objectid-to-timestamp');
// 根据 id 生成创建时间 created_at | 使用了 addCreatedAt 自定义插件
mongolass.plugin('addCreateAt', {
  afterFind: function(results) {
    results.forEach(function(item) {
      item.created_at = moment(ObjectIdToTimestamp(item._id)).format('YYYY-MM-DD HH:mm');
    });
    return results;
  },
  afterFindOne: function(result) {
    if (result) {
      result.created_at = moment(ObjectIdToTimestamp(result._id)).format('YYYY-MM-DD HH:mm');
    }
  }
})
