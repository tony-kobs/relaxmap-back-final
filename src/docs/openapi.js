export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Relax Map API',
    version: '1.0.0',
    description:
      'REST API for Природні Мандри / RelaxMap. Public paths have no /api prefix. Session cookies: sessionId, accessToken, refreshToken.',
  },
  servers: [{ url: '/', description: 'Current server' }],
  tags: [
    { name: 'Health' },
    { name: 'Auth' },
    { name: 'Users' },
    { name: 'Locations' },
    { name: 'Categories' },
    { name: 'Feedbacks' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          200: { description: '{ message, timestamp }' },
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
          201: { description: 'User created, session cookies set' },
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
    '/auth/request-reset-email': {
      post: {
        tags: ['Auth'],
        summary: 'Send password reset email',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: { email: { type: 'string', format: 'email' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Email sent' },
          404: { description: 'User not found' },
        },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password with token from email',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'password'],
                properties: {
                  token: { type: 'string' },
                  password: { type: 'string', minLength: 8, maxLength: 128 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password updated' },
          401: { description: 'Token invalid or expired' },
        },
      },
    },
    '/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Current user (includes email)',
        security: [{ cookieAuth: [] }],
        responses: {
          200: { description: 'Current user' },
          401: { description: 'Unauthorized' },
        },
      },
      patch: {
        tags: ['Users'],
        summary: 'Update profile name and/or avatar',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: false,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    minLength: 2,
                    maxLength: 32,
                  },
                  avatar: {
                    type: 'string',
                    format: 'binary',
                    description: 'jpg or png, max 1 MB',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Updated user' },
          400: { description: 'Validation error' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/users/{userId}': {
      get: {
        tags: ['Users'],
        summary: 'Public user profile',
        parameters: [{ $ref: '#/components/parameters/userId' }],
        responses: {
          200: { description: '_id, name, avatar' },
          404: { description: 'User not found' },
        },
      },
    },
    '/users/{userId}/locations': {
      get: {
        tags: ['Users'],
        summary: 'Locations owned by user',
        parameters: [
          { $ref: '#/components/parameters/userId' },
          { $ref: '#/components/parameters/page' },
          { $ref: '#/components/parameters/limit' },
        ],
        responses: {
          200: { description: 'Paginated location list' },
        },
      },
    },
    '/locations': {
      get: {
        tags: ['Locations'],
        summary: 'List locations',
        parameters: [
          { $ref: '#/components/parameters/page' },
          { $ref: '#/components/parameters/limit' },
          {
            name: 'region',
            in: 'query',
            schema: { type: 'string' },
            description: 'Category id (kind=region)',
          },
          {
            name: 'type',
            in: 'query',
            schema: { type: 'string' },
            description: 'Category id (kind=type); may repeat',
          },
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string' },
          },
          {
            name: 'sort',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['rating', 'popular', 'new'],
              default: 'rating',
            },
          },
        ],
        responses: {
          200: { description: 'Paginated location cards' },
        },
      },
      post: {
        tags: ['Locations'],
        summary: 'Create location',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: { $ref: '#/components/schemas/LocationForm' },
            },
          },
        },
        responses: {
          201: { description: 'Created location' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/locations/{locationId}': {
      get: {
        tags: ['Locations'],
        summary: 'Get one location',
        parameters: [{ $ref: '#/components/parameters/locationId' }],
        responses: {
          200: { description: 'Location card' },
          404: { description: 'Not found' },
        },
      },
      patch: {
        tags: ['Locations'],
        summary: 'Update own location',
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/locationId' }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: { $ref: '#/components/schemas/LocationForm' },
            },
          },
        },
        responses: {
          200: { description: 'Updated location' },
          403: { description: 'Not the owner' },
          404: { description: 'Not found' },
        },
      },
    },
    '/categories/regions': {
      get: {
        tags: ['Categories'],
        summary: 'List regions',
        responses: {
          200: { description: 'Array of { _id, name, kind: "region" }' },
        },
      },
    },
    '/categories/types': {
      get: {
        tags: ['Categories'],
        summary: 'List location types',
        responses: {
          200: { description: 'Array of { _id, name, kind: "type" }' },
        },
      },
    },
    '/feedbacks': {
      get: {
        tags: ['Feedbacks'],
        summary: 'List approved feedbacks',
        parameters: [
          {
            name: 'locationId',
            in: 'query',
            schema: { type: 'string' },
          },
          { $ref: '#/components/parameters/page' },
          { $ref: '#/components/parameters/limit' },
        ],
        responses: {
          200: { description: 'Paginated approved feedbacks only' },
        },
      },
      post: {
        tags: ['Feedbacks'],
        summary: 'Create feedback (status pending)',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateFeedback' },
            },
          },
        },
        responses: {
          201: { description: 'Created pending feedback' },
          404: { description: 'Location not found' },
        },
      },
    },
    '/feedbacks/{feedbackId}/approve': {
      patch: {
        tags: ['Feedbacks'],
        summary: 'Approve feedback (any authenticated user; no admin role)',
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'feedbackId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description:
              'Approved feedback; location rating and reviewsCount recalculated',
          },
          401: { description: 'Unauthorized' },
          404: { description: 'Feedback not found' },
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
    parameters: {
      userId: {
        name: 'userId',
        in: 'path',
        required: true,
        schema: { type: 'string' },
      },
      locationId: {
        name: 'locationId',
        in: 'path',
        required: true,
        schema: { type: 'string' },
      },
      page: {
        name: 'page',
        in: 'query',
        schema: { type: 'integer', minimum: 1, default: 1 },
      },
      limit: {
        name: 'limit',
        in: 'query',
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
      },
    },
    schemas: {
      RegisterPayload: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 32 },
          email: { type: 'string', format: 'email', maxLength: 64 },
          password: { type: 'string', minLength: 8, maxLength: 128 },
        },
      },
      LoginPayload: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      LocationForm: {
        type: 'object',
        required: ['name', 'type', 'region', 'description', 'images'],
        properties: {
          name: { type: 'string', minLength: 3, maxLength: 96 },
          type: { type: 'string', description: 'Category id' },
          region: { type: 'string', description: 'Category id' },
          description: { type: 'string', minLength: 20, maxLength: 6000 },
          images: {
            type: 'array',
            items: { type: 'string', format: 'binary' },
            maxItems: 8,
            description: 'jpg/png, at least one required',
          },
        },
      },
      CreateFeedback: {
        type: 'object',
        required: ['locationId', 'userName', 'rate', 'description'],
        properties: {
          locationId: { type: 'string' },
          userName: { type: 'string', minLength: 2, maxLength: 32 },
          rate: { type: 'number', minimum: 1, maximum: 5 },
          description: { type: 'string', minLength: 1, maxLength: 200 },
        },
      },
    },
  },
};
