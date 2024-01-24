const nodemailer = require('nodemailer')    // npm install nodemailer
const htmlToFormattedText = require('html-to-formatted-text')   // npm install html-to-formatted-text

module.exports = credentials => {
	const mailTransport = nodemailer.createTransport({
        // host: 'smtp.126.com',
        // 已经支持 QQ, 163, 126, iCloud, Hotmail, Yahoo
        service: '126',
        auth: {
            user: credentials.netease126.user,
            pass: credentials.netease126.password,
        },
	})

	const from = '"Levin Cao" <levincao@126.com>'
	const errorRecipient = 'levincao@126.com'

	return {
        send: (to, subject, html) => 
            mailTransport.sendMail({
                from,
                to,
                subject,
                html,
                text: htmlToFormattedText(html),
        }),
    }

}