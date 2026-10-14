const nodemailer = require('nodemailer');

const enabled = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

const transporter = enabled
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    })
  : null;

async function sendEmail(to, subject, text) {
  if (!enabled || !to) {
    return false;
  }
  try {
    await transporter.sendMail({
      from: `KaziForce-AI <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text
    });
    return true;
  } catch (err) {
    console.error('Email failed:', err.message);
    return false;
  }
}

module.exports = { sendEmail };