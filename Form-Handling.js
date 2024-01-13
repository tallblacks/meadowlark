const express = require('express')
const expressHandlebars = require('express-handlebars')

const handlers = require('./lib/handlers')
const weatherMiddlware = require('./lib/middleware/weather')

const app = express()
app.use(express.static(__dirname + '/public'))
app.use(weatherMiddlware)

const handlebars = expressHandlebars.create({ 
    defaultLayout: 'main',
    helpers: {
        section: function(name, options) {
            if(!this._sections) this._sections = {}
            this._sections[name] = options.fn(this)
            return null
        }
    }
});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

/* ==== ==== 路由 ==== ==== */
app.get('/', handlers.home)




/* ==== ==== 启动服务器 ==== ==== */
const port = process.env.PORT || 3000

if(require.main === module) {
    app.listen(port, () => {
        console.log( `Express started on http://localhost:${port}; press Ctrl-C to terminate.` )
    })
} else {
    module.exports = app
}