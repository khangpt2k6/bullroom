import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailNotification {
  userEmail: string;
  type: string;
  bookingId: string;
  roomId: string;
  startTime: string;
  endTime: string;
  message: string;
}

export async function sendBookingEmail(notification: EmailNotification) {
  try {
    const fromEmail = process.env.FROM_EMAIL || 'BullRoom <onboarding@resend.dev>';

    // Format dates
    const startDate = new Date(notification.startTime);
    const endDate = new Date(notification.endTime);
    const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));

    // Email content based on type
    const subject = notification.type === 'booking_confirmed'
      ? '✅ Booking Confirmed - BullRoom'
      : '📝 Booking Created - Confirmation Required';

    const htmlContent = notification.type === 'booking_confirmed'
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #006747;">🎉 Booking Confirmed!</h2>
          <p>Your room booking has been confirmed.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Booking Details</h3>
            <p><strong>Room:</strong> ${notification.roomId}</p>
            <p><strong>Date:</strong> ${startDate.toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${startDate.toLocaleTimeString()} - ${endDate.toLocaleTimeString()}</p>
            <p><strong>Duration:</strong> ${duration} minutes</p>
            <p><strong>Booking ID:</strong> ${notification.bookingId}</p>
          </div>
          
          <p style="color: #666;">See you at the room! 🚪</p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #006747;">📝 Booking Created</h2>
          <p>Your booking request has been created successfully.</p>
          
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <strong>⏱️ Important:</strong> Please confirm your booking within 10 minutes, or it will be automatically cancelled.
          </div>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Booking Details</h3>
            <p><strong>Room:</strong> ${notification.roomId}</p>
            <p><strong>Date:</strong> ${startDate.toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${startDate.toLocaleTimeString()} - ${endDate.toLocaleTimeString()}</p>
            <p><strong>Duration:</strong> ${duration} minutes</p>
            <p><strong>Booking ID:</strong> ${notification.bookingId}</p>
          </div>
          
          <p>Log in to the BullRoom app to confirm your booking.</p>
        </div>
      `;

    // If no API key, just log it
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_resend_api_key_here') {
      console.log('\n📧 ═══════════════════════════════════════');
      console.log('   EMAIL SIMULATION (No API Key)');
      console.log('═══════════════════════════════════════');
      console.log(`📬 To: ${notification.userEmail}`);
      console.log(`📋 Subject: ${subject}`);
      console.log(`🏷️  Booking ID: ${notification.bookingId}`);
      console.log(`🏠 Room: ${notification.roomId}`);
      console.log(`🕐 Start: ${startDate.toLocaleString()}`);
      console.log(`🕐 End: ${endDate.toLocaleString()}`);
      console.log(`⏱️  Duration: ${duration} minutes`);
      console.log(`💬 Message: ${notification.message}`);
      console.log('═══════════════════════════════════════');
      console.log('✅ Email logged (not sent - add RESEND_API_KEY to send real emails)\n');
      return { success: true, mode: 'simulation' };
    }

    // Send real email via Resend
    const result = await resend.emails.send({
      from: fromEmail,
      to: [notification.userEmail],
      subject: subject,
      html: htmlContent,
    });

    console.log(`✅ Email sent successfully to ${notification.userEmail}`);
    return { success: true, mode: 'sent', data: result };

  } catch (error) {
    console.error('❌ Error sending email:', error);
    // Don't throw - just log the error so the notification service keeps running
    return { success: false, error };
  }
}
