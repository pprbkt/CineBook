import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import { IBooking } from '../models/Booking';
import { logger } from '../utils/logger';

export const ticketService = {
  async generateQRCode(data: string): Promise<string> {
    try {
      return await QRCode.toDataURL(data, {
        width: 200,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });
    } catch (error) {
      logger.error('QR code generation error:', error);
      throw error;
    }
  },

  async generateTicketPDF(booking: any): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 400]);
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const { height } = page.getSize();

    // Background
    page.drawRectangle({
      x: 0, y: 0, width: 600, height: 400,
      color: rgb(0.08, 0.08, 0.12),
    });

    // Header accent bar
    page.drawRectangle({
      x: 0, y: height - 60, width: 600, height: 60,
      color: rgb(0.56, 0.27, 0.87),
    });

    // Title
    page.drawText('CINEBOOK', {
      x: 30, y: height - 42,
      size: 24, font, color: rgb(1, 1, 1),
    });

    page.drawText('E-TICKET', {
      x: 460, y: height - 42,
      size: 18, font, color: rgb(1, 1, 1),
    });

    // Event title
    const eventTitle = booking.event?.title || 'Event';
    page.drawText(eventTitle, {
      x: 30, y: height - 95,
      size: 18, font, color: rgb(0.9, 0.9, 0.95),
    });

    // Venue
    const venueName = booking.venue?.name || 'Venue';
    page.drawText(venueName, {
      x: 30, y: height - 120,
      size: 12, font: regularFont, color: rgb(0.7, 0.7, 0.75),
    });

    // Date & Time
    const showtime = booking.showtime;
    const dateStr = showtime?.dateTime
      ? new Date(showtime.dateTime).toLocaleString('en-IN', {
          dateStyle: 'full',
          timeStyle: 'short',
        })
      : 'TBD';
    page.drawText(`Date: ${dateStr}`, {
      x: 30, y: height - 155,
      size: 11, font: regularFont, color: rgb(0.8, 0.8, 0.85),
    });

    // Seats
    const seatStr = booking.seats.map((s: any) => `${s.row}${s.number}`).join(', ');
    page.drawText(`Seats: ${seatStr}`, {
      x: 30, y: height - 180,
      size: 11, font: regularFont, color: rgb(0.8, 0.8, 0.85),
    });

    // Amount
    page.drawText(`Total: ₹${booking.totalAmount}`, {
      x: 30, y: height - 205,
      size: 14, font, color: rgb(0.56, 0.87, 0.44),
    });

    // Ticket code
    page.drawText(`Ticket Code: ${booking.ticketCode}`, {
      x: 30, y: height - 240,
      size: 10, font: regularFont, color: rgb(0.6, 0.6, 0.65),
    });

    // Booking ID
    page.drawText(`Booking ID: ${booking._id}`, {
      x: 30, y: height - 260,
      size: 9, font: regularFont, color: rgb(0.5, 0.5, 0.55),
    });

    // QR Code
    try {
      const qrDataUrl = await this.generateQRCode(
        JSON.stringify({
          bookingId: booking._id.toString(),
          ticketCode: booking.ticketCode,
          event: eventTitle,
          seats: seatStr,
        })
      );
      const qrImageBytes = Buffer.from(qrDataUrl.split(',')[1], 'base64');
      const qrImage = await pdfDoc.embedPng(qrImageBytes);
      page.drawImage(qrImage, {
        x: 420, y: height - 280,
        width: 150, height: 150,
      });
    } catch (error) {
      logger.error('Error embedding QR in PDF:', error);
    }

    // Footer
    page.drawRectangle({
      x: 0, y: 0, width: 600, height: 40,
      color: rgb(0.1, 0.1, 0.14),
    });
    page.drawText('Thank you for booking with CineBook! Present this ticket at the venue.', {
      x: 30, y: 15,
      size: 9, font: regularFont, color: rgb(0.5, 0.5, 0.55),
    });

    // Dashed line separator
    for (let i = 0; i < 20; i++) {
      page.drawRectangle({
        x: 400 + (i % 2 === 0 ? 0 : 0),
        y: height - 85 - i * 0,
        width: 1,
        height: 1,
        color: rgb(0.3, 0.3, 0.35),
      });
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  },
};
