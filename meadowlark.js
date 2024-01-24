const express = require('express')
const app = express()


/* ==== ==== 基本设置 ==== ==== */
// 禁用 HTTP 头中的 "X-Powered-By" 字段。这个字段通常用于标识服务器所使用的技术。
// 也可以使用 app.set('x-powered-by', false) 达到相同的效果。
app.disable('x-powered-by')
app.use(express.static(__dirname + '/public'))
// 确保req.ip、req.protocol和req.secure反映了客户端与代理之间的连接细节，而不是客户端与应用程序之间的连接。
// 此外，req.ips将是一个数组，指示原始客户端IP以及任何中间代理的名称或IP地址。
app.enable('trust proxy')


/* ==== ==== Cookies ==== ==== */
const cookieParser = require('cookie-parser')   // npm install cookie-parser
const credentials = require('./credentials')
app.use(cookieParser(credentials.cookieSecret))


/* ==== ==== Sessions ==== ==== */
const expressSession = require('express-session')     // npm install express-session
// make sure you've linked in cookie middleware before session middleware!。
// resave：如果设置为 true，它会强制将会话保存回会话存储，即使在请求期间未修改会话。false：如果在请求期间未修改会话，则不保存会话。
// saveUninitialized：如果设置为 true，它会强制将未初始化的会话保存到存储。false：不保存未初始化的会话，节省存储空间。
// secret：这是一个用于签名会话 ID cookie 的字符串。
// app.use(expressSession({ resave: false, saveUninitialized: false, secret: credentials.cookieSecret }))


/* ==== ==== Redis ==== ==== */
// 上面 Sessions 部分省略如下注释语句
// const expressSession = require('express-session') 
const RedisStore = require('connect-redis').default
const { createClient } = require('redis')
const redisClient = createClient({ url: credentials.redisUri })
// 启动 Redis 客户端
redisClient.connect().catch(console.error)
// 配置 Express Session 中间件
app.use(expressSession({
    resave: false,
    saveUninitialized: false,
    secret: credentials.cookieSecret,
    store: new RedisStore({
        client: redisClient,
    }),
}));


/* ==== ==== Flash Message ==== ==== */
const flashMiddleware = require('./lib/middleware/flash')
app.use(flashMiddleware)


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
app.get('/newsletter-archive', handlers.newsletterArchive)


/* ==== ==== Vacation Photo ==== ==== */
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


/* ==== ==== Middleware ==== ==== */
const products = [
    { id: 'hPc8YUbFuZM9edw4DaxwHk', name: 'Rock Climbing Expedition in Bend', price: 239.95, requiresWaiver: true },
    { id: 'eyryDtCCu9UUcqe9XgjbRk', name: 'Walking Tour of Portland', price: 89.95 },
    { id: '6oC1Akf6EbcxWZXHQYNFwx', name: 'Manzanita Surf Expedition', price: 159.95, maxGuests: 4 },
    { id: 'w6wTWMx39zcBiTdpM9w5J7', name: 'Wine Tasting in the Willamette Valley', price: 229.95 },
  ]
// 使用Array.reduce方法，将一个包含产品信息的数组(products)转换成一个以产品ID为键的对象(productsById)。
//  reduce 接受一个回调函数和一个初始值 {}。byId 是累积的结果，初始值是一个空对象 {}。p 是当前数组元素，即产品对象。
// Object.assign() 方法用于将所有可枚举属性的值从一个或多个源对象复制到目标对象。在这里，目标对象是 byId，而源对象是 { [p.id]: p }，它包含一个以当前产品ID为键、产品对象为值的新对象。这个操作相当于将当前产品对象添加到 byId 对象中，以产品ID作为键。
// reduce 方法在数组的每个元素上都执行这个回调函数，最终返回累积的结果，这个结果就是一个以产品ID为键的对象，每个键对应一个产品对象。
const productsById = products.reduce((byId, p) => Object.assign(byId, { [p.id]: p }), {})
const cartValidation = require('./lib/cartValidation')
app.use(cartValidation.resetValidation)
app.use(cartValidation.checkWaivers)
app.use(cartValidation.checkGuestCounts)
app.get('/', (req, res) => {
    const cart = req.session.cart || { items: [] }
    const context = { products, cart }
    res.render('home', context)
})
app.post('/add-to-cart', (req, res) => {
    if(!req.session.cart) req.session.cart = { items: [] }
    const { cart } = req.session
    Object.keys(req.body).forEach(key => {
        if(!key.startsWith('guests-')) return
        const productId = key.split('-')[1]
        const product = productsById[productId]
        const guests = Number(req.body[key])
        if(guests === 0) return // no guests to add
        if(!cart.items.some(item => item.product.id === productId)) cart.items.push({ product, guests: 0 })
        const idx = cart.items.findIndex(item => item.product.id === productId)
        const item = cart.items[idx]
        item.guests += guests
        if(item.guests < 0) item.guests = 0
        if(item.guests === 0) cart.items.splice(idx, 1)
    })
    res.redirect('/')
})


/* ==== ==== Log ==== ==== */
const morgan = require('morgan')    //  npm install morgan
const fs = require('fs')

// export NODE_ENV=production
switch(app.get('env')) {
    case 'development':
        app.use(morgan('dev'))
        break
    case 'production':
        const stream = fs.createWriteStream(__dirname + '/access.log', { flags: 'a' })
        app.use(morgan('combined', { stream }))
        break
}


/* ==== ==== DB ==== ==== */
require('./mongodb/db')
// require('./postgres/db')
app.get('/vacations', handlers.listVacations)
app.get('/notify-me-when-in-season', handlers.notifyWhenInSeasonForm)
app.post('/notify-me-when-in-season', handlers.notifyWhenInSeasonProcess)
// :currency 是一个路由参数。它表示一个占位符，可以匹配在 URL 中的任何值。
// 在这个上下文中，:currency 用于捕获用户在 URL 中提供的货币代码。
// 路由处理程序可以通过 req.params.currency 来访问这个捕获的值，从而获取用户选择的货币。
app.get('/set-currency/:currency', handlers.setCurrency)


/* ==== ==== 路由 ==== ==== */
app.get('/weather', (req, res) => res.render('weather'))
app.get('/about', handlers.about)
app.get('/section-test', handlers.sectionTest)
app.get('/headers', (req, res) => {
    res.type('text/plain')
    const headers = Object.entries(req.headers).map(([key, value]) => `${key}: ${value}`)
    res.send(headers.join('\n'))
})

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

// 当应用接收到任何未匹配到其他路由的 GET 请求时（使用通配符 *）。
app.get('*', (req, res) => res.render('home'))


/* ==== ==== 启动服务器 ==== ==== */
const port = process.env.PORT || 3000

if(require.main === module) {
    app.listen(port, () => {
        console.log( `Express started in ` +
        `${app.get('env')} mode at http://localhost:${port}` +
        `; press Ctrl-C to terminate.` )
    })
} else {
    module.exports = app
}

// 另一个是 PM2
// npm install -g forever
// forever start meadowlark.js
// forever restart meadowlark.js
// forever stop meadowlark.js.