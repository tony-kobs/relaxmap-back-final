const REQUIRED_ENV = ['MONGO_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

export const assertRequiredEnv = () => {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]?.trim());

  if (missing.length) {
    throw new Error(`Missing required env: ${missing.join(', ')}`);
  }
};
