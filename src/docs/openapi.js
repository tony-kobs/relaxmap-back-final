export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'My Back Template API',
    version: '1.0.0',
    description:
      'Starter REST API for GoIT fullstack projects. Copy a resource module (route + controller + validation + model) to add a new entity.',
  },
  servers: [{ url: '/', description: 'Current server' }],
  tags: [
    { name: 'Health' },
    { name: 'Auth' },
    { name: 'Users' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          200: { description: 'Server is running' },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterPayload' },
            },
          },
        },
        responses: {
          201: { description: 'User created' },
          409: { description: 'Email in use' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginPayload' },
            },
          },
        },
        responses: {
          200: { description: 'Logged in, cookies set' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout',
        responses: {
          204: { description: 'Logged out' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh session cookies',
        responses: {
          200: { description: 'Session refreshed' },
          401: { description: 'Missing or expired refresh token' },
        },
      },
    },
    '/auth/session': {
      get: {
        tags: ['Auth'],
        summary: 'Check session and refresh if needed',
        responses: {
          200: { description: '{ success: boolean }' },
        },
      },
    },
    '/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Current user',
        security: [{ cookieAuth: [] }],
        responses: {
          200: { description: 'Current user' },
          401: { description: 'Unauthorized' },
        },
      },
      patch: {
        tags: ['Users'],
        summary: 'Update current user',
        security: [{ cookieAuth: [] }],
        responses: {
          200: { description: 'Updated user' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/users/me/avatar': {
      patch: {
        tags: ['Users'],
        summary: 'Upload avatar',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  avatar: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Updated user with avatar url' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'accessToken',
      },
    },
    schemas: {
      RegisterPayload: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
          password: { type: 'string' },
        },
      },
      LoginPayload: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string' },
          password: { type: 'string' },
        },
      },
    },
  },
};
