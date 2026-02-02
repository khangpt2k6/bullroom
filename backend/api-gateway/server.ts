import 'dotenv/config';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import connectDB from '../shared/config/database';
import { connectRabbitMQ } from '../shared/utils/rabbitmq';

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to databases
connectDB();
connectRabbitMQ();

// Import routes
import roomRoutes from './routes/rooms';
import bookingRoutes from './routes/bookings';

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: '🎓 Welcome to BullRoom API',
    version: '1.0.0',
    endpoints: {
      rooms: '/api/rooms',
      bookings: '/api/bookings'
    }
  });
});

app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
interface CustomError extends Error {
  status?: number;
}

app.use((err: CustomError, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏳ Shutting down gracefully...');
  process.exit(0);
});
