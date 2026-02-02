const amqp = require('amqplib');

let connection = null;
let channel = null;

const QUEUE_NAME = 'booking_requests';

// Connect to RabbitMQ
async function connectRabbitMQ() {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    // Assert queue exists
    await channel.assertQueue(QUEUE_NAME, {
      durable: true // Queue survives broker restart
    });

    console.log('✅ RabbitMQ connected successfully');

    // Handle connection errors
    connection.on('error', (err) => {
      console.error('❌ RabbitMQ connection error:', err.message);
    });

    connection.on('close', () => {
      console.warn('⚠️ RabbitMQ connection closed');
    });

    return { connection, channel };
  } catch (error) {
    console.error('❌ Failed to connect to RabbitMQ:', error.message);
    process.exit(1);
  }
}

// Publish booking request to queue
async function publishBookingRequest(bookingData) {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized');
  }

  const message = JSON.stringify(bookingData);

  channel.sendToQueue(QUEUE_NAME, Buffer.from(message), {
    persistent: true // Message survives broker restart
  });

  console.log(`📤 Published booking request: ${bookingData.roomId}`);
}

// Consume booking requests (used by booking-service)
async function consumeBookingRequests(callback) {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized');
  }

  // Set prefetch to 1 - process one message at a time
  await channel.prefetch(1);

  console.log('👂 Waiting for booking requests...');

  channel.consume(QUEUE_NAME, async (msg) => {
    if (msg) {
      try {
        const bookingData = JSON.parse(msg.content.toString());
        console.log(`📥 Received booking request: ${bookingData.roomId}`);

        // Process the booking
        await callback(bookingData);

        // Acknowledge message (remove from queue)
        channel.ack(msg);
      } catch (error) {
        console.error('❌ Error processing booking:', error.message);
        // Reject message and requeue
        channel.nack(msg, false, true);
      }
    }
  });
}

// Close connection gracefully
async function closeRabbitMQ() {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
    console.log('✅ RabbitMQ connection closed');
  } catch (error) {
    console.error('❌ Error closing RabbitMQ:', error.message);
  }
}

module.exports = {
  connectRabbitMQ,
  publishBookingRequest,
  consumeBookingRequests,
  closeRabbitMQ,
  QUEUE_NAME
};
