const nodemailer = require('nodemailer');
const logger = require('./logger');

const sendEmail = async (options) => {
  if (!process.env.SMTP_HOST) {
    logger.warn('SMTP_HOST not configured. Email was not sent.', { to: options.email, subject: options.subject });
    // In dev mode, we can log the password to console just to be safe
    console.log(`[MOCK EMAIL SENT TO ${options.email}] Subject: ${options.subject}\n\n${options.message}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  await transporter.sendMail(message);
};

module.exports = {
  sendEmail,
};
