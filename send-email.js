const credentials = require('./credentials')
const emailService = require('./lib/email')(credentials)
const email = '1145066@qq.com, "Levin Cao" <levincao@gmail.com>'

const Handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
// 不要用绝对地址
const templatePath = path.resolve(__dirname, 'views/email/cart-thank-you.handlebars');
const templateSource = fs.readFileSync(path.resolve(__dirname, templatePath), 'utf8');
const template = Handlebars.compile(templateSource);
const context = {
    cart: {
        billing: {
            name: 'Levin Cao', // 实际数据
        },
        // 其他属性
    },
    // 其他数据
};
const renderedHtml = template(context);

if(email) {
    emailService.send(email, "Hood River tours on sale today!", renderedHtml, 
      "<h1>Meadowlark Travel</h1>\n<p>Thanks for book your trip with Meadowlark Travel.  <b>We look forward to your visit!</b>")
      .then(() => {
        console.log('sent successfully!')
      })
      .catch(err => {
        console.log('failed to send email: ', err.message)
      })
} else {
    console.log('Edit this file, and specify an email address to test....')
}