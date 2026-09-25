import bcrypt from 'bcrypt';
import { isValidObjectId } from 'mongoose';
import { Session } from '../models/session.js';
import { User } from '../models/user.js';
import {
  clearSessionCookies,
  createSession,
  refreshSession,
  setSessionCookies,
} from '../services/auth.js';
import { notImplemented } from '../utils/notImplemented.js';

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

export const loginUser = notImplemented;

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
export const requestResetEmail = notImplemented;
export const resetPassword = notImplemented;
