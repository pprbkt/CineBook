import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: false,
  auth: config.smtp.user
    ? {
        user: config.smtp.user,
        pass: config.smtp.pass,
      }
    : undefined,
});

export const emailService = {
  async sendBookingConfirmation(
    to: string,
    booking: any,
    pdfBuffer?: Buffer
  ): Promise<void> {
    try {
      const attachments: any[] = [];
      if (pdfBuffer) {
        attachments.push({
          filename: `CineBook_Ticket_${booking.ticketCode}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        });
      }

      await transporter.sendMail({
        from: `"CineBook" <${config.smtp.user || 'noreply@cinebook.app'}>`,
        to,
        subject: `Booking Confirmed - ${booking.event?.title || 'Event'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0d0d14; color: #e5e5ea; padding: 30px; border-radius: 12px;">
            <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #8f44db;">
              <h1 style="color: #8f44db; margin: 0;">CineBook</h1>
              <p style="color: #888; margin: 5px 0 0;">Your Booking is Confirmed! 🎬</p>
            </div>
            <div style="padding: 20px 0;">
              <h2 style="color: #fff;">${booking.event?.title || 'Event'}</h2>
              <p><strong>Venue:</strong> ${booking.venue?.name || 'Venue'}</p>
              <p><strong>Seats:</strong> ${booking.seats?.map((s: any) => `${s.row}${s.number}`).join(', ') || 'N/A'}</p>
              <p><strong>Amount:</strong> ₹${booking.totalAmount}</p>
              <p><strong>Ticket Code:</strong> <code style="background: #1a1a2e; padding: 3px 8px; border-radius: 4px; color: #8f44db;">${booking.ticketCode}</code></p>
            </div>
            <div style="background: #1a1a2e; padding: 15px; border-radius: 8px; text-align: center;">
              <p style="color: #888; margin: 0;">Your e-ticket is attached to this email. Present it at the venue.</p>
            </div>
            <p style="color: #555; font-size: 12px; text-align: center; margin-top: 20px;">© ${new Date().getFullYear()} CineBook. All rights reserved.</p>
          </div>
        `,
        attachments,
      });
      logger.info(`Booking confirmation email sent to ${to}`);
    } catch (error) {
      logger.error('Email sending error:', error);
      // Don't throw — email failure shouldn't block booking
    }
  },

  async sendCancellationConfirmation(to: string, booking: any): Promise<void> {
    try {
      await transporter.sendMail({
        from: `"CineBook" <${config.smtp.user || 'noreply@cinebook.app'}>`,
        to,
        subject: `Booking Cancelled - ${booking.event?.title || 'Event'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0d0d14; color: #e5e5ea; padding: 30px; border-radius: 12px;">
            <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #e74c3c;">
              <h1 style="color: #8f44db; margin: 0;">CineBook</h1>
              <p style="color: #e74c3c; margin: 5px 0 0;">Booking Cancelled</p>
            </div>
            <div style="padding: 20px 0;">
              <h2 style="color: #fff;">${booking.event?.title || 'Event'}</h2>
              <p><strong>Ticket Code:</strong> ${booking.ticketCode}</p>
              <p><strong>Refund Amount:</strong> ₹${booking.refundAmount || booking.totalAmount}</p>
              <p style="color: #888;">Your refund will be processed within 5-7 business days.</p>
            </div>
          </div>
        `,
      });
    } catch (error) {
      logger.error('Cancellation email error:', error);
    }
  },
};
