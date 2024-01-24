// 全局中间件（Global Middleware），在Express框架中，它是指注册在应用程序级别，而不是与特定路由相关联的中间件函数。
// 这样的中间件将在每个请求上执行，因此它对整个应用程序是全局生效的。
// 会在每个请求处理周期的不同阶段执行。这包括请求到达时、路由匹配之前、路由处理之后，以及响应被发送之前。
// 全局中间件会按照注册的顺序在请求处理链中执行。先注册的中间件会先执行，然后按照注册的顺序执行下一个中间件。
// 无论用户请求的是哪个路径，这个中间件都会在请求处理链中的每个请求上执行。
const express = require('express')
const app = express()

app.use((req, res, next) => { 
	console.log('\n\nALLWAYS')
	next() 
})

app.get('/a', (req, res) => { 
	console.log('/a: route terminated')
	res.send('a')
})
app.get('/a', (req, res) => { 
	console.log('/a: never called');
})
app.get('/b', (req, res, next) => { 
	console.log('/b: route not terminated')
	next()
})
app.use((req, res, next) => {
	console.log('SOMETIMES')
	next()
})
app.get('/b', (req, res, next) => {
	console.log('/b (part 2): error thrown' )
	throw new Error('b failed')
})
app.use('/b', (err, req, res, next) => {
	console.log('/b error detected and passed on')
	next(err)
})
app.get('/c', (err, req) => {
	console.log('/c: error thrown')
	throw new Error('c failed')
})
app.use('/c', (err, req, res, next) => {
	console.log('/c: error detected but not passed on')
	next()
})

app.use((err, req, res, next) => {
	console.log('unhandled error detected: ' + err.message)
	res.send('500 - server error')
})

app.use((req, res) => {
	console.log('route not handled')
	res.send('404 - not found')
})

const port = process.env.PORT || 3000
app.listen(port, () => console.log( `Express started on http://localhost:${port}` +
  '; press Ctrl-C to terminate.'))