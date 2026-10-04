const objectIdSchema = {
  type: 'string',
  pattern: '^[a-fA-F0-9]{24}$',
  description: 'MongoDB ObjectId (24 hex chars)',
};

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Relax Map API',
    version: '1.0.0',
    description: [
      'Backend for Природні Мандри / RelaxMap.',
      'Public paths have **no** `/api` prefix (the Next.js front adds it).',
      'Auth uses httpOnly cookies: `sessionId`, `accessToken`, `refreshToken`.',
      'Feedbacks: public GET list + private POST create; new review appears immediately and updates location rating.',
    ].join(' '),
  },
  servers: [
    { url: 'http://localhost:4000', description: 'Local' },
    { url: '/', description: 'Current server' },
  ],
  tags: [
    { name: 'Health', description: 'Liveness' },
    { name: 'Auth', description: 'Register, login, session, password reset' },
    { name: 'Users', description: 'Profile and public user pages' },
    { name: 'Locations', description: 'Places catalog and CRUD' },
    { name: 'Categories', description: 'Regions and location types' },
    { name: 'Feedbacks', description: 'Reviews' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          200: {
            description: 'Process is up',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register',
        description: 'Creates user, replaces previous sessions, sets auth cookies.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterPayload' },
            },
          },
        },
        responses: {
          201: {
            description: 'User created; Set-Cookie for session',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserPrivate' },
              },
            },
          },
          409: { description: 'Email already in use', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        description: 'Validates credentials, replaces previous sessions, sets auth cookies.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginPayload' },
            },
          },
        },
        responses: {
          200: {
            description: 'Logged in; Set-Cookie for session',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserPrivate' },
              },
            },
          },
          401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout',
        responses: {
          204: { description: 'Session deleted, cookies cleared' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh session cookies',
        description: 'Uses `sessionId` + `refreshToken` cookies.',
        responses: {
          200: { description: 'Cookies refreshed' },
          401: { description: 'Missing or expired refresh', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
        },
      },
    },
    '/auth/session': {
      get: {
        tags: ['Auth'],
        summary: 'Check session',
        description:
          'Returns `{ success }` with HTTP 200. If access expired but refresh is valid, silently refreshes cookies.',
        responses: {
          200: {
            description: 'Session status',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SessionCheck' },
              },
            },
          },
        },
      },
    },
    '/auth/request-reset-email': {
      post: {
        tags: ['Auth'],
        summary: 'Request password reset email',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email', maxLength: 64 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Email sent',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Reset password email has been sent' },
                  },
                },
              },
            },
          },
          404: { description: 'User not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
        },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password',
        description: 'Uses JWT from email link. Clears all sessions for the user.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ResetPasswordPayload' },
            },
          },
        },
        responses: {
          200: {
            description: 'Password updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Password has been reset' },
                  },
                },
              },
            },
          },
          401: { description: 'Token invalid or expired', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
          404: { description: 'User not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
        },
      },
    },
    '/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Current user',
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: 'Private profile (includes email)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserPrivate' },
              },
            },
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
        },
      },
      patch: {
        tags: ['Users'],
        summary: 'Update profile',
        description: 'multipart/form-data: optional `name` and/or `avatar` file. No separate `/users/me/avatar` route.',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: false,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', minLength: 2, maxLength: 32 },
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
          200: {
            description: 'Updated user',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserPrivate' },
              },
            },
          },
          400: { description: 'Validation / file error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
        },
      },
    },
    '/users/{userId}': {
      get: {
        tags: ['Users'],
        summary: 'Public user profile',
        parameters: [{ $ref: '#/components/parameters/userId' }],
        responses: {
          200: {
            description: 'Public fields only',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserPublic' },
              },
            },
          },
          404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
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
          200: {
            description: 'Paginated locations',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LocationList' },
              },
            },
          },
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
            schema: objectIdSchema,
            description: 'Category id (kind=region)',
          },
          {
            name: 'type',
            in: 'query',
            style: 'form',
            explode: true,
            schema: { type: 'array', items: objectIdSchema },
            description: 'Category id (kind=type); repeat key for several',
          },
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string', maxLength: 96 },
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
          200: {
            description: 'Paginated location cards',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LocationList' },
              },
            },
          },
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
          201: {
            description: 'Created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LocationCard' },
              },
            },
          },
          400: { description: 'Validation / images error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
        },
      },
    },
    '/locations/{locationId}': {
      get: {
        tags: ['Locations'],
        summary: 'Get one location',
        parameters: [{ $ref: '#/components/parameters/locationId' }],
        responses: {
          200: {
            description: 'Location card',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LocationCard' },
              },
            },
          },
          404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
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
          200: {
            description: 'Updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LocationCard' },
              },
            },
          },
          403: { description: 'Not the owner', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
          404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
        },
      },
    },
    '/categories/regions': {
      get: {
        tags: ['Categories'],
        summary: 'List regions',
        responses: {
          200: {
            description: 'Regions',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Category' },
                },
              },
            },
          },
        },
      },
    },
    '/categories/types': {
      get: {
        tags: ['Categories'],
        summary: 'List location types',
        responses: {
          200: {
            description: 'Types',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Category' },
                },
              },
            },
          },
        },
      },
    },
    '/feedbacks': {
      get: {
        tags: ['Feedbacks'],
        summary: 'List feedbacks',
        description: 'Without `locationId` — home feed; with it — reviews for that place. Pagination supported.',
        parameters: [
          {
            name: 'locationId',
            in: 'query',
            schema: objectIdSchema,
          },
          { $ref: '#/components/parameters/page' },
          { $ref: '#/components/parameters/limit' },
        ],
        responses: {
          200: {
            description: 'Paginated feedbacks',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/FeedbackList' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Feedbacks'],
        summary: 'Create feedback',
        description:
          'Creates a review that appears in GET immediately. Recalculates location `rating` and `reviewsCount`.',
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
          201: {
            description: 'Created feedback',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Feedback' },
              },
            },
          },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
          404: { description: 'Location not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
        },
      },
    },
    '/feedbacks/{feedbackId}': {
      delete: {
        tags: ['Feedbacks'],
        summary: 'Delete own feedback',
        description:
          'Only the author can delete. Recalculates location `rating` and `reviewsCount`.',
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/feedbackId' }],
        responses: {
          204: { description: 'Deleted' },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
          403: { description: 'Not the owner', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
          404: { description: 'Feedback not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
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
        description: 'Also requires `sessionId` cookie. Set after login/register.',
      },
    },
    parameters: {
      userId: {
        name: 'userId',
        in: 'path',
        required: true,
        schema: objectIdSchema,
      },
      locationId: {
        name: 'locationId',
        in: 'path',
        required: true,
        schema: objectIdSchema,
      },
      feedbackId: {
        name: 'feedbackId',
        in: 'path',
        required: true,
        schema: objectIdSchema,
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
      ErrorMessage: {
        type: 'object',
        properties: {
          message: { type: 'string' },
        },
        required: ['message'],
      },
      HealthResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'OK' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      SessionCheck: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
        },
        required: ['success'],
      },
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
      ResetPasswordPayload: {
        type: 'object',
        required: ['token', 'password'],
        properties: {
          token: { type: 'string' },
          password: { type: 'string', minLength: 8, maxLength: 128 },
        },
      },
      UserPublic: {
        type: 'object',
        properties: {
          _id: objectIdSchema,
          name: { type: 'string' },
          avatar: { type: 'string' },
        },
      },
      UserPrivate: {
        allOf: [
          { $ref: '#/components/schemas/UserPublic' },
          {
            type: 'object',
            properties: {
              email: { type: 'string', format: 'email' },
            },
          },
        ],
      },
      Category: {
        type: 'object',
        properties: {
          _id: objectIdSchema,
          name: { type: 'string' },
          kind: { type: 'string', enum: ['region', 'type'] },
        },
      },
      LocationCard: {
        type: 'object',
        properties: {
          _id: objectIdSchema,
          name: { type: 'string' },
          description: { type: 'string' },
          images: { type: 'array', items: { type: 'string' } },
          rating: { type: 'number', minimum: 0, maximum: 5 },
          reviewsCount: { type: 'integer', minimum: 0 },
          type: { $ref: '#/components/schemas/Category' },
          region: { $ref: '#/components/schemas/Category' },
          owner: { $ref: '#/components/schemas/UserPublic' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      LocationList: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/LocationCard' },
          },
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
      LocationForm: {
        type: 'object',
        required: ['name', 'type', 'region', 'description', 'images'],
        properties: {
          name: { type: 'string', minLength: 3, maxLength: 96 },
          type: { ...objectIdSchema, description: 'Category id (kind=type)' },
          region: { ...objectIdSchema, description: 'Category id (kind=region)' },
          description: { type: 'string', minLength: 20, maxLength: 6000 },
          images: {
            type: 'array',
            items: { type: 'string', format: 'binary' },
            minItems: 1,
            maxItems: 8,
            description: 'jpg/png, each ≤ 1 MB',
          },
        },
      },
      CreateFeedback: {
        type: 'object',
        required: ['locationId', 'userName', 'rate', 'description'],
        properties: {
          locationId: objectIdSchema,
          userName: { type: 'string', minLength: 2, maxLength: 32 },
          rate: { type: 'number', minimum: 1, maximum: 5 },
          description: { type: 'string', minLength: 1, maxLength: 200 },
        },
      },
      Feedback: {
        type: 'object',
        properties: {
          _id: objectIdSchema,
          locationId: objectIdSchema,
          owner: objectIdSchema,
          userName: { type: 'string' },
          rate: { type: 'number', minimum: 1, maximum: 5 },
          description: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      FeedbackList: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/Feedback' },
          },
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
    },
  },
};
