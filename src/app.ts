import express from 'express';
import cors from 'cors';

import newsRoutes         from './routes/news.routes';
import commentRoutes      from './routes/comment.routes';
import categoryRoutes     from './routes/category.routes';
import notificationRoutes from './routes/notification.routes';
import reporterRoutes     from './routes/reporter.routes';
import adminRoutes        from './routes/admin.routes';
import authRoutes from './routes/auth.routes';
import { getBookmarks } from './controllers/news.controller';
import { authenticate } from './middleware/auth.middleware';

const app = express();

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Midpoint Media API is running',
  });
});

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.use('/api/news',          newsRoutes);
app.use('/api/comments',      commentRoutes);
app.use('/api/categories',    categoryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reporter',      reporterRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/auth',          authRoutes);
app.get('/api/bookmarks',     authenticate, getBookmarks);
/*
|--------------------------------------------------------------------------
| 404 Handler
|--------------------------------------------------------------------------
*/

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

/*
|--------------------------------------------------------------------------
| Global Error Handler
|--------------------------------------------------------------------------
*/

app.use(
  (
    error: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error('Unhandled error:', error);

    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
);

export default app;