import createHttpError from 'http-errors';
import { Session } from '../models/session.js';
import { User } from '../models/user.js';
import { refreshSession, setSessionCookies } from '../services/auth.js';

const loadUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw createHttpError(401, 'User not found');
  }

  return user;
};

export const authenticate = async (req, res, next) => {
  const { sessionId, accessToken, refreshToken } = req.cookies ?? {};

  if (!sessionId || !accessToken) {
    if (sessionId && refreshToken) {
      try {
        const session = await refreshSession({ sessionId, refreshToken });
        setSessionCookies(res, session);
        req.user = await loadUser(session.userId);
        next();
        return;
      } catch {
        throw createHttpError(401, 'Access token expired');
      }
    }

    throw createHttpError(401, 'Missing access token');
  }

  const session = await Session.findOne({
    _id: sessionId,
    accessToken,
  });

  if (!session) {
    throw createHttpError(401, 'Session not found');
  }

  if (session.accessTokenValidUntil >= new Date()) {
    req.user = await loadUser(session.userId);
    next();
    return;
  }

  if (!refreshToken) {
    throw createHttpError(401, 'Access token expired');
  }

  try {
    const refreshed = await refreshSession({ sessionId, refreshToken });
    setSessionCookies(res, refreshed);
    req.user = await loadUser(refreshed.userId);
    next();
  } catch {
    throw createHttpError(401, 'Access token expired');
  }
};
