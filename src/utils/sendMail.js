import nodemailer from 'nodemailer';
import createHttpError from 'http-errors';

// Без явних таймаутів nodemailer чекає з'єднання до 2 хвилин, а неактивний
// сокет тримає до 10 хвилин. Якщо хостинг блокує SMTP-порт, запит
// «висить», тож обмежуємо очікування і повертаємо зрозумілу помилку.
const SMTP_TIMEOUT_MS = 10_000;

const isMailConfigured = () =>
  Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD,
  );

export const sendEmail = async (options) => {
  if (!isMailConfigured()) {
    throw createHttpError(500, 'SMTP is not configured');
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
  });

  try {
    await transporter.sendMail(options);
  } catch (error) {
    console.error('SMTP send failed:', error.code ?? '', error.message);
    throw createHttpError(502, 'Failed to send email. Please try again later.');
  }
};
