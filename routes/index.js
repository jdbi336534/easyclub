const router = require('koa-router')();
const config = require('../config');
const Promise = require('promise');
const Page = require('../common/page');

router.get('/', async function (ctx, next) {

  let current_tag = config.tags.indexOf(ctx.query.tag ) > -1
      ? ctx.query.tag : 'all';

  // +号让其转换为数字
  let current_page = +ctx.query.page || 1;

  // 读取主题列表
  let Topic = ctx.model('topic');
  // 组合查询对象
  let query = {deleted: false};

  if(current_tag != 'all')
    query.tag = current_tag;
  // 查询数据
  let result = await Topic.getTopicForPage(query, null, {
    sort: '-top -last_reply_at'
  }, current_page);

  let topics = result.data;

  //  读取用户信息
  let User = ctx.model("user");
  let Reply = ctx.model('reply');

  topics = await Promise.all(topics.map( async (topic) => {
    topic.author = await User.findById(topic.author_id, 'username avatar');
    if(topic.last_reply) {
      topic.reply = await Reply.findById(topic.last_reply, 'author_id');
      topic.reply.author = await User.findById(topic.reply.author_id, 'username');
    }
    return topic;
  }));

  await ctx.render('index', {
    title: '首页',
    topics: topics,
    tags: config.tags,
    current_tag: current_tag,
    page: result.page
  }); 
})

module.exports = router;
