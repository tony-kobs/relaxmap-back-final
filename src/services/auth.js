import jwt from 'jsonwebtoken';
import { Session } from '../models/session.js';
import { FIFTEEN_MINUTES, THIRTY_DAYS } from '../constants/time.js';

const getCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge,
});

export const createSession = async (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: '15m',
  });

  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '30d',
  });

  const now = Date.now();

  return Session.create({
    userId,
    accessToken,
    refreshToken,
    accessTokenValidUntil: new Date(now + FIFTEEN_MINUTES),
    refreshTokenValidUntil: new Date(now + THIRTY_DAYS),
  });
};

export const setSessionCookies = (res, session) => {
  res.cookie(
    'sessionId',
    session._id.toString(),
    getCookieOptions(THIRTY_DAYS),
  );
  res.cookie(
    'accessToken',
    session.accessToken,
    getCookieOptions(FIFTEEN_MINUTES),
  );
  res.cookie(
    'refreshToken',
    session.refreshToken,
    getCookieOptions(THIRTY_DAYS),
  );
};

export const clearSessionCookies = (res) => {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  };

  res.clearCookie('sessionId', options);
  res.clearCookie('accessToken', options);
  res.clearCookie('refreshToken', options);
};

export const refreshSession = async ({ sessionId, refreshToken }) => {
  const session = await Session.findOne({
    _id: sessionId,
    refreshToken,
  });

  if (!session) {
    return null;
  }

  if (session.refreshTokenValidUntil < new Date()) {
    await session.deleteOne();
    return null;
  }

  const userId = session.userId;
  await session.deleteOne();
  return createSession(userId);
};
