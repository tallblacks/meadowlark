const express = require('express')
const expressHandlebars = require('express-handlebars')
// npm install cookie-parser
const cookieParser = require('cookie-parser')
// npm install express-session
const session = require('express-session')
// npm install cat-names
const catNames = require('cat-names')
const handlers = require('./lib/handlers')
const app = express()
const port = process.env.PORT || 3000


// configure Handlebars view engine
const handlebars = expressHandlebars.create({ defaultLayout: 'main' });
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.disable('x-powered-by')

app.use(express.static(__dirname + '/public'))

// the following is needed for cookie support
// 设置了用于解析 cookie 的中间件。cookieParser 中间件解析传入的 cookie 并将其在 req.cookies 对象中提供。
// 解析后的 cookie 可以在 req.cookies 中访问。
app.use(cookieParser())

// the following is needed for session support
// 使用 express-session 中间件来管理会话。
// resave：如果设置为 true，它会强制将会话保存回会话存储，即使在请求期间未修改会话。
// resave: false：如果在请求期间未修改会话，则不保存会话。
// saveUninitialized：如果设置为 true，它会强制将未初始化的会话保存到存储。
// saveUninitialized: false：不保存未初始化的会话，节省存储空间。
// secret：这是一个用于签名会话 ID cookie 的字符串。
// secret: 'keyboard cat'：为签名会话ID cookie提供一个秘密密钥，以提高安全性。
app.use(session({ resave: false, saveUninitialized: false, secret: 'keyboard cat' }))


app.get('/', handlers.home)
app.get('/about', handlers.about)

app.get('/headers', (req, res) => {
    res.type('text/plain')
    const headers = Object.entries(req.headers).map(([key, value]) => `${key}: ${value}`)
    res.send(headers.join('\n'))
})

app.get('/greeting', (req, res) => {
    // res.render 方法渲染了一个视图（view）模板，视图的名称是 'greeting'。
    // 视图 'greeting' 可能是一个模板文件，通常使用模板引擎（如EJS、Handlebars等）编写。
    // 通过传递一个包含消息、样式、用户ID和用户名等信息的对象给视图模板，可以在生成的页面中使用这些数据。
    res.render('greeting', {
        message: 'Hello esteemed programmer!',
        style: req.query.style,
        userid: req.cookies.userid,
        username: req.session.username
    })
})

// the following layout doesn't have a layout file, so
// views/no-layout.handlebars must include all necessary HTML
app.get('/no-layout', (req, res) =>
  res.render('no-layout', { layout: null })
)


app.get('/set-random-userid', (req, res) => {
    // toFixed(0) 方法用于将 Math.random()*10000 的结果四舍五入为最接近的整数。这确保用户ID是一个整数而不是一个浮点数。
    res.cookie('userid', (Math.random()*10000).toFixed(0))
    res.redirect('/greeting')
})
  
app.get('/set-random-username', (req, res) => {
    req.session.username = catNames.random()
    res.redirect('/greeting')
})
  

// custom 404 page
app.use(handlers.notFound)
// custom 500 page
// app.use(handlers.serverError)
app.get('/error', (req, res) => res.status(500).render('error'))


// 当应用接收到任何未匹配到其他路由的 GET 请求时（使用通配符 *），它将发送一个包含链接的响应，提示用户查看他们的问候页面。
app.get('*', (req, res) => res.send('Check out our <a href="/greeting">greeting</a> page!'))


// 在 Node.js 中，require.main 是一个全局变量，用于标识当前模块是通过直接运行还是通过 require 语句引入的。
// 当一个文件被直接运行时，require.main 被设置为指向该文件的 module 对象。如果文件是通过 require 引入的，require.main 就会是 undefined。
if(require.main === module) {
    app.listen(port, () => {
        console.log(`Express started on http://localhost:${port}; press Ctrl-C to terminate.`)
    })
} else {
    module.exports = app
}