
// npm install cookie-parser
const cookieParser = require('cookie-parser')
// npm install express-session
const session = require('express-session')
// npm install cat-names
const catNames = require('cat-names')
// npm install body-parser
const bodyParser = require('body-parser')

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

// extended: false 是一个配置选项，用于指定解析 URL 编码的请求体时，
// 使用 Node.js 内置的 querystring 库来解析。如果将 extended 设置为 false，则使用 querystring 解析
// 如果设置为 true，则使用第三方库 qs 解析。
// 具体而言，extended: false 会将 URL 编码的数据解析为键值对形式，而 extended: true 支持更丰富的数据解析，包括嵌套对象等。
app.use(bodyParser.urlencoded({extend: false}))
app.use(bodyParser.json())

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

app.get('/custom-layout', (req, res) =>
    res.render('custom-layout', { layout: 'custom' })
)

app.get('/text', (req, res) => {
    res.type('text/plain')
    res.send('this is a test')
})
    


app.get('/set-random-userid', (req, res) => {
    // toFixed(0) 方法用于将 Math.random()*10000 的结果四舍五入为最接近的整数。这确保用户ID是一个整数而不是一个浮点数。
    res.cookie('userid', (Math.random()*10000).toFixed(0))
    res.redirect('/greeting')
})
  
app.get('/set-random-username', (req, res) => {
    req.session.username = catNames.random()
    res.redirect('/greeting')
})
  

// see the views/error.hbs file for the contents of this view
app.get('/bad-bad-not-good', (req, res) => {
    // we're going to simulate something bad happening in your code....
    throw new Error("that didn't go well!")
})

app.get('/thank-you', (req, res) => res.render('11-thank-you'))
app.get('/contact-error', (req, res) => res.render('11-contact-error'))


app.post('/process-contact', (req, res) => {
    try {
        // here's where we would try to save contact to database or other
        // persistence mechanism...for now, we'll just simulate an error
        // 检查请求体 (req.body) 中名为 simulateError 的属性。处理请求时模拟错误条件的机制。
        if(req.body.simulateError) throw new Error("error saving contact!")
        console.log(`contact from ${req.body.name} <${req.body.email}>`)
        res.format({
            'text/html': () => res.redirect(303, '/thank-you'),
            'application/json': () => res.json({ success: true }),
        })
    } catch (err) {
        // here's where we would handle any persistence failures
        console.error(`error processing contact from ${req.body.name} ` + `<${req.body.email}>`)
        res.format({
            'text/html': () => res.redirect(303, '/contact-error'),
            'application/json': () => res.status(500).json({
            error: 'error saving contact information' }),
        })
    }

    console.log(`received contact from ${req.body.name} <${req.body.email}>`)
    res.redirect(303, '10-thank-you')
})


const tours = [
    { id: 0, name: 'Hood River', price: 99.99 },
    { id: 1, name: 'Oregon Coast', price: 149.95 },
]
app.get('/api/tours', (req, res) => {
    const toursXml = '<?xml version="1.0"?><tours>' +
        tours.map(p =>
        `<tour price="${p.price}" id="${p.id}">${p.name}</tour>`
        ).join('') + '</tours>'
    const toursText = tours.map(p => `${p.id}: ${p.name} (${p.price})`).join('\n')
    res.format({
        'application/json': () => res.json(tours),
        'application/xml': () => res.type('application/xml').send(toursXml),
        'text/xml': () => res.type('text/xml').send(toursXml),
        'text/plain': () => res.type('text/plain').send(toursXml),
    })
})

app.put('/api/tour/:id', (req, res) => {
    // 在一个数组（假设为tours）中查找具有特定ID的元素。
    const p = tours.find(p => p.id === parseInt(req.params.id))
    if(!p) return res.status(410).json({ error: 'No such tour exists' })
    if(req.body.name) p.name = req.body.name
    if(req.body.price) p.price = req.body.price
    res.json({ success: true })
})

// splice 用于修改数组。第二个参数 1 是要删除的元素个数。
app.delete('/api/tour/:id', (req, res) => {
    const idx = tours.findIndex(tour => tour.id === parseInt(req.params.id))
    if(idx < 0) return res.json({ error: 'No such tour exists.' })
    tours.splice(idx, 1)
    res.json({ success: true })
})


// 当应用接收到任何未匹配到其他路由的 GET 请求时（使用通配符 *），它将发送一个包含链接的响应，提示用户查看他们的问候页面。
// app.get('*', (req, res) => res.send('Check out our <a href="/greeting">greeting</a> page!'))
app.get('*', (req, res) => res.render('08-click-here'))