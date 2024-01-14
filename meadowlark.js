const express = require('express')
const app = express()


/* ==== ==== 基本设置 ==== ==== */
// 禁用 HTTP 头中的 "X-Powered-By" 字段。这个字段通常用于标识服务器所使用的技术。
// 也可以使用 app.set('x-powered-by', false) 达到相同的效果。
app.disable('x-powered-by')

app.use(express.static(__dirname + '/public'))


/* ==== ==== Handlebars ==== ==== */
const expressHandlebars = require('express-handlebars')
const handlers = require('./lib/handlers')

const handlebars = expressHandlebars.create({ 
    defaultLayout: 'main',
    // 定义了一个自定义的 Handlebars 辅助函数，这个函数叫做 section。辅助函数是一种可以在 Handlebars 模板中调用的自定义函数
    helpers: {
        section: function(name, options) {
            if(!this._sections) this._sections = {}
            // 使用 options.fn(this) 调用了 section 的内容，将其结果存储在 this._sections[name] 中。
            // options 是包含当前上下文的对象，以及包含一个 fn 属性的对象。
            // 在Handlebars中，options.fn(this) 是一个内置的Handlebars函数，用于执行包含在{{#section}}{{/section}}块中的模板内容。
            // options 是Handlebars提供给辅助函数的一个对象，它包含了一些有用的方法和属性。
            // options.fn(this) 是一个函数调用，它实际上是执行了包含在{{#section}}{{/section}}块中的模板内容，并且this指向了当前上下文。
            // 在这里，section 辅助函数的目的是将块中的内容存储在 this._sections[name] 中，以便稍后在模板的其他地方引用。
            this._sections[name] = options.fn(this)
            // 返回 null，因为 section 函数的调用通常是为了设置变量，而不是输出到模板。
            return null
        }
    }
});
app.engine('handlebars', handlebars.engine);
// 上面两行也可以这样写
// app.engine('handlebars', expressHandlebars({ defaultLayout: 'main' }))
app.set('view engine', 'handlebars');


/* ==== ==== Weather Middlware ==== ==== */
const weatherMiddlware = require('./lib/middleware/weather')
app.use(weatherMiddlware)


/* ==== ==== Form Handling ==== ==== */
const bodyParser = require('body-parser') // npm install body-parser
const multiparty = require('multiparty')  // npm install multiparty

// extended: true 表示使用第三方查询字符串库 qs 来解析 URL 编码的数据，将数据解析为嵌套对象。
// 如果设置为 false，则使用 Node.js 内置的 querystring 库，将数据解析为浅层对象。
app.use(bodyParser.urlencoded({ extended: true }))
// bodyParser.json() 指定 body-parser 使用 JSON 格式解析请求体，并将解析后的数据添加到 req.body 中。
app.use(bodyParser.json())

// handlers for browser-based form submission
app.get('/newsletter-signup', handlers.newsletterSignup)
app.post('/newsletter-signup/process', handlers.newsletterSignupProcess)
app.get('/newsletter-signup/thank-you', handlers.newsletterSignupThankYou)
// handlers for fetch/JSON form submission
app.get('/newsletter', handlers.newsletter)
app.post('/api/newsletter-signup', handlers.api.newsletterSignup)

// vacation photo contest
app.get('/contest/vacation-photo', handlers.vacationPhotoContest)
app.get('/contest/vacation-photo-ajax', handlers.vacationPhotoContestAjax)
app.post('/contest/vacation-photo/:year/:month', (req, res) => {
    const form = new multiparty.Form()
    form.parse(req, (err, fields, files) => {
        if(err) return handlers.vacationPhotoContestProcessError(req, res, err.message)
        handlers.vacationPhotoContestProcess(req, res, fields, files)
    })
})
app.get('/contest/vacation-photo-thank-you', handlers.vacationPhotoContestProcessThankYou)
app.post('/api/vacation-photo-contest/:year/:month', (req, res) => {
    const form = new multiparty.Form()
    form.parse(req, (err, fields, files) => {
        if(err) return handlers.api.vacationPhotoContestError(req, res, err.message)
        handlers.api.vacationPhotoContest(req, res, fields, files)
    })
})


/* ==== ==== 路由 ==== ==== */
app.get('/', handlers.home)
app.get('/about', handlers.about)
app.get('/section-test', handlers.sectionTest)

// 定制 404 页面
app.use(handlers.notFound)
// app.use((req, res) =>
//     res.status(404).render('404')
// )

// 定制 500 页面
app.use(handlers.serverError)
// app.get('/error', (req, res) => res.status(500).render('error'))
// app.use((err, req, res, next) => {
//     console.error('** SERVER ERROR: ' + err.message)
//     res.status(500).render('08-error', { message: "you shouldn't have clicked that!" })
// })


/* ==== ==== 启动服务器 ==== ==== */
const port = process.env.PORT || 3000

if(require.main === module) {
    app.listen(port, () => {
        console.log( `Express started on http://localhost:${port}; press Ctrl-C to terminate.` )
    })
} else {
    module.exports = app
}