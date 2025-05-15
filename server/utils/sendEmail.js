const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('[DEBUG] Configurazione SMTP:', {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE,
  user: process.env.SMTP_USER,
  from: process.env.EMAIL_FROM
});

// Configurazione SMTP per Gmail
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465,
  secure: process.env.SMTP_SECURE === 'true', // true per 465, false per 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD // Deve essere una password per app!
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.error('[GMAIL] Errore nella configurazione SMTP:', error);
    console.error('[GMAIL] Ricorda: per Gmail serve una password per app, non la password normale!');
  } else {
    console.log('[GMAIL] Server SMTP pronto a inviare email.');
  }
});

const sendEmail = async (options) => {
  const message = {
    from: process.env.EMAIL_FROM || 'Othoca Labs <tuoindirizzo@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message
    // puoi aggiungere anche `html: options.html` se vuoi inviare email in HTML
  };

  try {
    const info = await transporter.sendMail(message);
    console.log('[GMAIL] Email inviata con successo:', info);
  } catch (err) {
    console.error('[GMAIL] Errore durante l\'invio dell\'email:', err);
    throw err;
  }
};

module.exports = sendEmail;
