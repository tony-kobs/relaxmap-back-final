const baseCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
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