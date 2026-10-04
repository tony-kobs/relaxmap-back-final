import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const sendMail = vi.fn();
const createTransport = vi.fn(() => ({ sendMail }));

vi.mock('nodemailer', () => ({
  default: { createTransport },
}));

const { sendEmail } = await import('../src/utils/sendMail.js');

const SMTP_ENV = {
  SMTP_HOST: 'in-v3.mailjet.com',
  SMTP_PORT: '2525',
  SMTP_USER: 'user',
  SMTP_PASSWORD: 'secret',
};

const message = {
  from: 'noreply@relaxmap.local',
  to: 'ada@example.com',
  subject: 'Reset your password',
  html: '<p>Hi</p>',
};

beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(process.env, SMTP_ENV);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('sendEmail', () => {
  it('limits SMTP timeouts so the request does not hang', async () => {
    sendMail.mockResolvedValue({ messageId: '1' });

    await sendEmail(message);

    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'in-v3.mailjet.com',
        port: 2525,
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 10_000,
      }),
    );
    expect(sendMail).toHaveBeenCalledWith(message);
  });

  it('turns an SMTP failure into a 502 error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const timeout = Object.assign(new Error('Connection timeout'), {
      code: 'ETIMEDOUT',
    });
    sendMail.mockRejectedValue(timeout);

    await expect(sendEmail(message)).rejects.toMatchObject({
      status: 502,
      message: 'Failed to send email. Please try again later.',
    });
  });

  it('fails fast when SMTP is not configured', async () => {
    delete process.env.SMTP_HOST;

    await expect(sendEmail(message)).rejects.toMatchObject({
      status: 500,
      message: 'SMTP is not configured',
    });
    expect(createTransport).not.toHaveBeenCalled();
  });
});
