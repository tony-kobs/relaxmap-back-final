import createHttpError from 'http-errors';
import jwt from 'jsonwebtoken';
import { isValidObjectId } from 'mongoose';
import { FIFTEEN_MINUTES, THIRTY_DAYS } from '../constants/time.js';
import { Session } from '../models/session.js';

const baseCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

export const createSession = async (userId) => {
  const tokens = generateTokens(userId);

  return Session.create({
    userId,
    ...tokens,
  });
};

export const setSessionCookies = (res, session) => {
  res.cookie('sessionId', session._id.toString(), {
    ...baseCookieOptions,
    expires: session.refreshTokenValidUntil,
  });
  res.cookie('accessToken', session.accessToken, {
    ...baseCookieOptions,
    expires: session.accessTokenValidUntil,
  });
  res.cookie('refreshToken', session.refreshToken, {
    ...baseCookieOptions,
    expires: session.refreshTokenValidUntil,
  });
};

export const clearSessionCookies = (res) => {
  res.clearCookie('sessionId', baseCookieOptions);
  res.clearCookie('accessToken', baseCookieOptions);
  res.clearCookie('refreshToken', baseCookieOptions);
};

const generateTokens = (userId) => {
  const accessTokenValidUntil = new Date(Date.now() + FIFTEEN_MINUTES);
  const refreshTokenValidUntil = new Date(Date.now() + THIRTY_DAYS);

  const accessToken = jwt.sign(
    { userId: userId.toString() },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: FIFTEEN_MINUTES / 1000 },
  );

  const refreshToken = jwt.sign(
    { userId: userId.toString() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: THIRTY_DAYS / 1000 },
  );

  return {
    accessToken,
    refreshToken,
    accessTokenValidUntil,
    refreshTokenValidUntil,
  };
};

export const refreshSession = async ({ sessionId, refreshToken }) => {
  if (!sessionId || !refreshToken || !isValidObjectId(sessionId)) {
    throw createHttpError(401, 'Unauthorized');
  }

  const session = await Session.findOne({ _id: sessionId, refreshToken });

  if (!session || session.refreshTokenValidUntil < new Date()) {
    throw createHttpError(401, 'Unauthorized');
  }

  const tokens = generateTokens(session.userId);

  session.accessToken = tokens.accessToken;
  session.refreshToken = tokens.refreshToken;
  session.accessTokenValidUntil = tokens.accessTokenValidUntil;
  session.refreshTokenValidUntil = tokens.refreshTokenValidUntil;

  await session.save();

  return session;
};
