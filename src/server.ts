import dotenv from 'dotenv';
import app from './app';
import { testDatabaseConnection } from './config/database';

dotenv.config();

const PORT = Number(process.env.PORT) || 5000;

const startServer = async (): Promise<void> => {
  try {
    // Test PostgreSQL connection
    await testDatabaseConnection();

    app.listen(PORT, () => {
      console.log('');
      console.log('========================================');
      console.log('🚀 MIDPOINT MEDIA API');
      console.log('========================================');
      console.log(`🌐 Server: http://localhost:${PORT}`);
      console.log(`❤️  Health: http://localhost:${PORT}/api/health`);
      console.log('========================================');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();