import * as amqp from 'amqplib';
import { BookingQueueMessage } from '../types';

let connection: amqp.Connection | null = null;
let channel: amqp.Channel | null = null;

const QUEUE_NAME = 'booking_requests';

// connect to RabbitMQ
async function connectRabbitMQ(): Promise<{ connection: amqp.Connection; channel: amqp.Channel }> {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL as string);
    channel = await connection.createChannel();

    // Assert queue exists
    await channel.assertQueue(QUEUE_NAME, {
      durable: true // Queue survives broker restart
    });

    console.log('✅ RabbitMQ connected successfully');

    // Handle connection errors
    connection.on('error', (err: Error) => {
      console.error('❌ RabbitMQ connection error:', err.message);
    });

    connection.on('close', () => {
      console.warn('⚠️ RabbitMQ connection closed');
    });

    return { connection, channel };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Failed to connect to RabbitMQ:', errorMessage);
    process.exit(1);
  }
}

// publish booking request to queue
async function publishBookingRequest(bookingData: BookingQueueMessage): Promise<void> {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized');
  }

  const message = JSON.stringify(bookingData);

  channel.sendToQueue(QUEUE_NAME, Buffer.from(message), {
    persistent: true
  });

  console.log(`📤 Published booking request: ${bookingData.roomId}`);
}

// consume booking requests from queue
async function consumeBookingRequests(
  callback: (data: BookingQueueMessage) => Promise<void>
): Promise<void> {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized');
  }

  await channel.prefetch(1);

  console.log('👂 Waiting for booking requests...');

  channel.consume(QUEUE_NAME, async (msg: amqp.ConsumeMessage | null) => {
    if (msg) {
      try {
        const bookingData: BookingQueueMessage = JSON.parse(msg.content.toString());
        console.log(`📥 Received booking request: ${bookingData.roomId}`);

        // Process the booking
        await callback(bookingData);

        // Acknowledge message (remove from queue)
        channel!.ack(msg);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ Error processing booking:', errorMessage);
        // Reject message and requeue
        channel!.nack(msg, false, true);
      }
    }
  });
}

// close RabbitMQ connection
async function closeRabbitMQ(): Promise<void> {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
    console.log('✅ RabbitMQ connection closed');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error closing RabbitMQ:', errorMessage);
  }
}

export {
  connectRabbitMQ,
  publishBookingRequest,
  consumeBookingRequests,
  closeRabbitMQ,
  QUEUE_NAME
};
