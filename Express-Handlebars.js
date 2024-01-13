const express = require('express')
const app = express()

app.disable('x-powered-by')
app.use(express.static(__dirname + '/public'))

/* ==== ==== ==== ==== */
// 引入和启用中间件 for Handlebars
const expressHandlebars = require('express-handlebars')
const handlers = require('./lib/handlers')

// 启动 Handlebars 模版
const handlebars = expressHandlebars.create({ 
    defaultLayout: 'main',
    // 定义了一个自定义的 Handlebars 辅助函数，这个函数叫做 section。
    // 辅助函数是一种可以在 Handlebars 模板中调用的自定义函数
    helpers: {
        section: function(name, options) {
            // 检查 this._sections 是否存在，如果不存在，则初始化为一个空对象。
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


/* ==== ==== ==== ==== */
// Weather Middlware
const weatherMiddlware = require('./lib/middleware/weather')

app.use(weatherMiddlware)


/* ==== ==== ==== ==== */
// 路由
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

/* ==== ==== ==== ==== */
// 启动服务器
const port = process.env.PORT || 3000

// 在 Node.js 中，require.main 是一个全局变量，用于标识当前模块是通过直接运行还是通过 require 语句引入的。
// 当一个文件被直接运行时，require.main 被设置为指向该文件的 module 对象。如果文件是通过 require 引入的，require.main 就会是 undefined。
if(require.main === module) {
    app.listen(port, () => {
        console.log(`Express started on http://localhost:${port}; press Ctrl-C to terminate.` )
    })
} else {
    module.exports = app
}
