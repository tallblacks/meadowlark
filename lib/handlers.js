const fortune = require('./fortune')

exports.home = (req, res) => res.render('home')

exports.about = (req, res) => res.render('about', { fortune: fortune.getFortune() })

exports.notFound = (req, res) => res.render('404')

// Express recognizes the error handler by way of its four
// argumetns, so we have to disable ESLint's no-unused-vars rule
// 在Express中，错误处理中间件（error handler middleware）通常有四个参数
// SLint的no-unused-vars规则会在代码中存在未使用的变量时发出警告
/* eslint-disable no-unused-vars */
exports.serverError = (err, req, res, next) => res.render('500')
/* eslint-enable no-unused-vars */