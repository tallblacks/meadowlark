// slightly modified version of the official W3C HTML5 email regex:
// https://html.spec.whatwg.org/multipage/forms.html#valid-e-mail-address
const VALID_EMAIL_REGEX = new RegExp('^[a-zA-Z0-9.!#$%&\'*+\/=?^_`{|}~-]+@' +
  '[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?' +
  '(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$')

// fake "newsletter signup" interface
class NewsletterSignup {
    constructor({ name, email }) {
      this.name = name
      this.email = email
    }
    async save() {
      // here's where we would do the work of saving to a database
      // since this method is async, it will return a promise, and
      // since we're not throwing any errors, the promise will
      // resolve successfully
    }
}

exports.api = {}

exports.home = (req, res) => res.render('home')

const fortune = require('./fortune')
exports.about = (req, res) => res.render('about', { fortune: fortune.getFortune() })

exports.notFound = (req, res) => res.render('404')

exports.sectionTest = (req, res) => res.render('section-test')

// Express recognizes the error handler by way of its four
// argumetns, so we have to disable ESLint's no-unused-vars rule
// 在Express中，错误处理中间件（error handler middleware）通常有四个参数
// SLint的no-unused-vars规则会在代码中存在未使用的变量时发出警告
/* eslint-disable no-unused-vars */
exports.serverError = (err, req, res, next) => {
    res.render('500')
    console.log(err)
}
/* eslint-enable no-unused-vars */


// **** these handlers are for browser-submitted forms
exports.newsletterSignup = (req, res) => {
    res.render('newsletter-signup', { csrf: 'CSRF token goes here' })
}
exports.newsletterSignupProcess = (req, res) => {
    const name = req.body.name || '', email = req.body.email || ''
    // input validation
    if(!VALID_EMAIL_REGEX.test(email)) {
        req.session.flash = {
            type: 'danger',
            intro: 'Validation error!',
            message: 'The email address you entered was not valid.',
        }
        return res.redirect(303, '/newsletter-signup')
    }
    // NewsletterSignup is an example of an object you might create; since
    // every implementation will vary, it is up to you to write these
    // project-specific interfaces.  This simply shows how a typical
    // Express implementation might look in your project.
    new NewsletterSignup({ name, email }).save()
        .then(() => {
            req.session.flash = {
                type: 'success',
                intro: 'Thank you!',
                message: 'You have now been signed up for the newsletter.',
            }
            return res.redirect(303, '/newsletter-archive')
        })
        .catch(err => {
            req.session.flash = {
                type: 'danger',
                intro: 'Database error!',
                message: 'There was a database error; please try again later.',
            }
            return res.redirect(303, '/newsletter-archive')
        })
}
exports.newsletterSignupThankYou = (req, res) => res.render('newsletter-signup-thank-you')
exports.newsletterArchive = (req, res) => res.render('newsletter-archive')
// **** end browser-submitted form handlers

// **** these handlers are for fetch/JSON form handlers
exports.newsletter = (req, res) => {
    res.render('newsletter', { csrf: 'CSRF token goes here' })
}
exports.api.newsletterSignup = (req, res) => {
    console.log('CSRF token (from hidden form field): ' + req.body._csrf)
    console.log('Name (from visible form field): ' + req.body.name)
    console.log('Email (from visible form field): ' + req.body.email)
    res.send({ result: 'success' })
}
// **** end fetch/JSON form handlers


exports.vacationPhotoContest = (req, res) => {
    const now = new Date()
    res.render('contest/vacation-photo', { year: now.getFullYear(), month: now.getMonth() })
}
exports.vacationPhotoContestAjax = (req, res) => {
    const now = new Date()
    res.render('contest/vacation-photo-ajax', { year: now.getFullYear(), month: now.getMonth() })
}
exports.vacationPhotoContestProcess = (req, res, fields, files) => {
    console.log('field data: ', fields)
    console.log('files: ', files)
    res.redirect(303, '/contest/vacation-photo-thank-you')
}
exports.vacationPhotoContestProcessError = (req, res, fields, files) => {
    res.redirect(303, '/contest/vacation-photo-error')
}
exports.vacationPhotoContestProcessThankYou = (req, res) => {
    res.render('contest/vacation-photo-thank-you')
}
exports.api.vacationPhotoContest = (req, res, fields, files) => {
    console.log('field data: ', fields)
    console.log('files: ', files)
    res.send({ result: 'success' })
}
exports.api.vacationPhotoContestError = (req, res, message) => {
    res.send({ result: 'error', error: message })
}

function convertFromUSD(value, currency) {
    switch(currency) {
      case 'USD': return value * 1
      case 'GBP': return value * 0.79
      case 'BTC': return value * 0.000078
      default: return NaN
    }
}
// const db = require('../mongodb/db')
const db = require('../postgres/db')
exports.listVacations = async (req, res) => {
    const vacations = await db.getVacations({ available: true })
    const currency = req.session.currency || 'USD'
    const context = {
        currency: currency,
        // 对数组 vacations 中的每个元素执行给定的函数，并返回一个新数组，该数组包含每个元素函数的返回值。
        vacations: vacations.map(vacation => {
            return {
                sku: vacation.sku,
                name: vacation.name,
                description: vacation.description,
                inSeason: vacation.inSeason,
                price: convertFromUSD(vacation.price, currency),
                qty: vacation.qty,
            }
        }),
    }
    switch(currency) {
      case 'USD': context.currencyUSD = 'selected'; break
      case 'GBP': context.currencyGBP = 'selected'; break
      case 'BTC': context.currencyBTC = 'selected'; break
    }
    res.render('vacations', context)
}
exports.notifyWhenInSeasonForm = (req, res) =>
    res.render('notify-me-when-in-season', { sku: req.query.sku })

exports.notifyWhenInSeasonProcess = async (req, res) => {
    const { email, sku } = req.body
    await db.addVacationInSeasonListener(email, sku)
    return res.redirect(303, '/vacations')
}
// note that this redirects to the /vacations page, but may
// want to use on // other pages!  should fix....
exports.setCurrency = (req, res) => {
    req.session.currency = req.params.currency
    return res.redirect(303, '/vacations')
}