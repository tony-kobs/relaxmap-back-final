import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { connectMongoDB } from './db/connectMongoDB.js';
import { logger } from './middleware/logger.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import { openApiSpec } from './docs/openapi.js';

const app = express();
const PORT = process.env.PORT ?? 3000;

const corsOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
].filter(Boolean);

app.get('/api-docs.json', (req, res) => {
  res.status(200).json(openApiSpec);
});

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, {
    customSiteTitle: 'API Docs',
  }),
);

app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);
app.use(logger);
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  }),
);

app.use(healthRoutes);
app.use(authRoutes);
app.use('/users', userRoutes);
app.use(locationRoutes);
app.use(categoryRoutes);
app.use(feedbackRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

await connectMongoDB();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
