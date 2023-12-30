const express = require('express')
const expressHandlebars = require('express-handlebars')
const handlers = require('./lib/handlers')
const app = express()
const port = process.env.PORT || 3000


// configure Handlebars view engine
const handlebars = expressHandlebars.create({ defaultLayout: 'main' });
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.use(express.static(__dirname + '/public'))

app.get('/', handlers.home)
app.get('/about', handlers.about)

app.get('/headers', (req, res) => {
    res.type('text/plain')
    const headers = Object.entries(req.headers).map(([key, value]) => `${key}: ${value}`)
    res.send(headers.join('\n'))
})

// custom 404 page
app.use(handlers.notFound)
// custom 500 page
app.use(handlers.serverError)

// 在 Node.js 中，require.main 是一个全局变量，用于标识当前模块是通过直接运行还是通过 require 语句引入的。
// 当一个文件被直接运行时，require.main 被设置为指向该文件的 module 对象。如果文件是通过 require 引入的，require.main 就会是 undefined。
if(require.main === module) {
    app.listen(port, () => {
        console.log(`Express started on http://localhost:${port}; press Ctrl-C to terminate.`)
    })
} else {
    module.exports = app
}