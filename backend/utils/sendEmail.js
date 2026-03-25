const nodemailer = require("nodemailer"); // lib send email
require("dotenv").config();

const sendEmail = async (options) => {

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true, 
    auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
    }
})

    // define the email options (like to, from, subject, HTML or text)
    const mailoptions = {
        from: 'Gheras Team <' + process.env.EMAIL_USER + '>',
        to: options.email,
        subject: options.subject,
        // text: options.message
        html: options.message
    }

    await transporter.sendMail(mailoptions);

}

module.exports = sendEmail;

