import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcrypt';
import createHttpError from 'http-errors';
import handlebars from 'handlebars';
import jwt from 'jsonwebtoken';
import { isValidObjectId } from 'mongoose';
import { FIFTEEN_MINUTES } from '../constants/time.js';
import { Session } from '../models/session.js';
import { User } from '../models/user.js';
import {
  clearSessionCookies,
  createSession,
  refreshSession,
  setSessionCookies,
} from '../services/auth.js';
import { sendEmail } from '../utils/sendMail.js';

const resetTemplatePath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../templates/reset-password-email.html',
);

let resetTemplate;

const renderResetEmail = async ({ name, link }) => {
  if (!resetTemplate) {
    const source = await readFile(resetTemplatePath, 'utf8');
    resetTemplate = handlebars.compile(source);
  }

  return resetTemplate({ name, link });
};

const SALT_ROUNDS = 10;

export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  const session = await createSession(user._id);
  setSessionCookies(res, session);

  res.status(201).json(user);
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw createHttpError(401, 'Невірний email або пароль');
  }

  const isPasswordEqual = await bcrypt.compare(password, user.password);
  if (!isPasswordEqual) {
    throw createHttpError(401, 'Невірний email або пароль');
  }

  const session = await createSession(user._id);
  setSessionCookies(res, session);

  res.status(200).json(user);
};

export const logoutUser = async (req, res) => {
    const { sessionId } = req.cookies ?? {};

    if (sessionId && isValidObjectId(sessionId)) {
        await Session.findByIdAndDelete(sessionId);
    }

    clearSessionCookies(res);
    res.status(204).end();
};

export const refreshUserSession = async (req, res) => {
  const { sessionId, refreshToken } = req.cookies ?? {};

  const session = await refreshSession({ sessionId, refreshToken });

  setSessionCookies(res, session);
  res.status(200).end();
};

export const getSession = async (req, res) => {
  const { sessionId, accessToken, refreshToken } = req.cookies ?? {};

  if (sessionId && accessToken && isValidObjectId(sessionId)) {
    const session = await Session.findOne({ _id: sessionId, accessToken });

    if (session && session.accessTokenValidUntil >= new Date()) {
      return res.status(200).json({ success: true });
    }
  }

  if (sessionId && refreshToken && isValidObjectId(sessionId)) {
    try {
      const session = await refreshSession({ sessionId, refreshToken });
      setSessionCookies(res, session);
      return res.status(200).json({ success: true });
    } catch {
      return res.status(200).json({ success: false });
    }
  }

  res.status(200).json({ success: false });
};

export const requestResetEmail = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  if (!process.env.FRONTEND_URL) {
    throw createHttpError(500, 'FRONTEND_URL is not configured');
  }

  const token = jwt.sign(
    { purpose: 'password-reset', email: user.email },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: FIFTEEN_MINUTES / 1000,
      subject: user._id.toString(),
    },
  );

  const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  const html = await renderResetEmail({ name: user.name, link });

  await sendEmail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: user.email,
    subject: 'Reset your password',
    html,
  });

  res.status(200).json({ message: 'Reset password email has been sent' });
};

export const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  let payload;

  try {
    payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw createHttpError(401, 'Token is expired or invalid');
    }

    throw error;
  }

  if (payload.purpose !== 'password-reset' || !payload.sub || !payload.email) {
    throw createHttpError(401, 'Token is expired or invalid');
  }

  const user = await User.findOne({ _id: payload.sub, email: payload.email });

  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  user.password = await bcrypt.hash(password, SALT_ROUNDS);
  await user.save();
  await Session.deleteMany({ userId: user._id });

  res.status(200).json({ message: 'Password has been reset' });
};
