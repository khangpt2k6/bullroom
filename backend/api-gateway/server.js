require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('../shared/config/database');
const { connectRabbitMQ } = require('../shared/utils/rabbitmq');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to databases
connectDB();
connectRabbitMQ();

// Import routes
const roomRoutes = require('./routes/rooms');
const bookingRoutes = require('./routes/bookings');

// Routes
app.get('/', (req, res) => {
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
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
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
