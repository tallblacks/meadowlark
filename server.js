const express = require('express')
const cluster = require('cluster')

const app = express()

app.use((req, res, next) => {
    if(cluster.isWorker)
        console.log(`Worker ${cluster.worker.id} received request`)
    next()
})

app.get('/fail', (req, res) => {
    throw new Error('Nope!')
})

app.get('/epic-fail', (req, res) => {
    // 路由的处理程序使用 process.nextTick 将一个函数推迟到事件循环的下一个迭代执行。
    // 无论是否发生错误，都会执行 res.send('embarrassed')
    // 演示了在异步操作中抛出错误的情况。由于 process.nextTick 将错误抛出推迟到事件循环的下一个迭代，
    // 因此错误不会被直接捕获，而是会在事件循环的下一个轮次中引发。这可能导致应用程序在抛出错误后仍然能够继续运行其他代码。
    // process.nextTick 类似于使用参数为0调用setTimeout，但它更高效。通常在服务器端代码中不会使用它。
    process.nextTick(() => {
        throw new Error('Kaboom!')
    })
    res.send('embarrased')
})

app.get('*', (req, res) => res.send('online'))

process.on('uncaughtException', err => {
    console.error('UNCAUGHT EXCEPTION\n', err.stack);
    // do any cleanup you need to do here...close 
    // database connections, etc.  you'll probably
    // also want to notify your operations team
    // that a critical error occurred; you can use
    // email or even better a service like Sentry,
    // Rollbar, or New Relic
    process.exit(1)
})

function startServer(port) {
    app.listen(port, function() {
        console.log(`Express started in ${app.get('env')} ` +
            `mode on http://localhost:${port}` +
            `; press Ctrl-C to terminate.`)
    })
}

if(require.main === module) {
    // application run directly; start app server
    startServer(process.env.PORT || 3000)
} else {
    // application imported as a module via "require": export
    // function to create server
    module.exports = startServer
}