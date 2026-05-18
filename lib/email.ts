import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: process.env.EMAIL_USER && process.env.EMAIL_PASSWORD
    ? {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      }
    : undefined,
});

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface BookingEmailData {
  clientName: string;
  clientEmail: string;
  confirmationNumber: string;
  bookingDate: string;
  packageType: string;
  message?: string | null;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    // Use EMAIL_USER as sender (the authenticated Gmail account)
    // Fallback to EMAIL_FROM if defined, otherwise use EMAIL_USER
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@timelessmediastudio.com';
    
    const result = await transporter.sendMail({
      from: fromEmail,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text || params.html.replace(/<[^>]*>/g, ''),
    });
    console.log(`✓ Email sent from ${fromEmail} to ${params.to} - Message ID: ${result.messageId}`);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
}

export function getApprovalEmail(data: BookingEmailData): EmailParams {
  return {
    to: data.clientEmail,
    subject: '✓ Your Booking Has Been Approved - Timeless Media Studio',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1f2937 0%, #111827 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 32px; font-weight: bold;">✓ Booking Approved</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your booking has been confirmed</p>
        </div>

        <!-- Main Content -->
        <div style="background-color: white; padding: 40px 20px; color: #1f2937;">
          <p style="font-size: 18px; margin: 0 0 30px 0;">
            Hello <strong>${data.clientName}</strong>,
          </p>

          <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin: 0 0 30px 0;">
            Great news! Your booking has been <strong style="color: #10b981;">approved</strong>. We're excited to work with you on your project!
          </p>

          <!-- Booking Details -->
          <div style="background-color: #f9fafb; border-left: 4px solid #10b981; padding: 20px; border-radius: 4px; margin: 30px 0;">
            <h3 style="margin: 0 0 20px 0; color: #1f2937; font-size: 16px;">Booking Details</h3>
            
            <div style="margin-bottom: 15px;">
              <p style="margin: 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Confirmation Number</p>
              <p style="margin: 5px 0 0 0; font-size: 22px; font-weight: bold; color: #10b981; font-family: 'Courier New', monospace;">${data.confirmationNumber}</p>
            </div>

            <div style="margin-bottom: 15px;">
              <p style="margin: 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Package</p>
              <p style="margin: 5px 0 0 0; font-size: 16px; color: #1f2937; font-weight: 500;">${data.packageType}</p>
            </div>

            <div style="margin-bottom: 15px;">
              <p style="margin: 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Booking Date</p>
              <p style="margin: 5px 0 0 0; font-size: 16px; color: #1f2937; font-weight: 500;">${new Date(data.bookingDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            ${data.message ? `
            <div>
              <p style="margin: 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Special Notes</p>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #4b5563; font-style: italic;">"${data.message}"</p>
            </div>
            ` : ''}
          </div>

          <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin: 30px 0;">
            Our team will be in touch shortly with next steps. If you have any questions or need to make changes, please don't hesitate to contact us.
          </p>

          <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin: 30px 0 0 0;">
            We look forward to creating something amazing with you!
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #1f2937; color: white; padding: 30px 20px; text-align: center; border-radius: 0 0 8px 8px;">
          <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">Timeless Media Studio</p>
          <p style="margin: 0; font-size: 12px; opacity: 0.8;">Professional Photography & Media Services</p>
          <p style="margin: 15px 0 0 0; font-size: 11px; opacity: 0.6;">Keep this confirmation number for your records</p>
        </div>
      </div>
    `,
  };
}

export function getCancellationEmail(data: BookingEmailData): EmailParams {
  return {
    to: data.clientEmail,
    subject: '✗ Your Booking Has Been Cancelled - Timeless Media Studio',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 32px; font-weight: bold;">✗ Booking Cancelled</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your booking status has been updated</p>
        </div>

        <!-- Main Content -->
        <div style="background-color: white; padding: 40px 20px; color: #1f2937;">
          <p style="font-size: 18px; margin: 0 0 30px 0;">
            Hello <strong>${data.clientName}</strong>,
          </p>

          <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin: 0 0 30px 0;">
            Your booking has been <strong style="color: #dc2626;">cancelled</strong>. If this was unexpected or if you have any questions about this cancellation, please contact us as soon as possible.
          </p>

          <!-- Booking Details -->
          <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; border-radius: 4px; margin: 30px 0;">
            <h3 style="margin: 0 0 20px 0; color: #1f2937; font-size: 16px;">Cancelled Booking Details</h3>
            
            <div style="margin-bottom: 15px;">
              <p style="margin: 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Confirmation Number</p>
              <p style="margin: 5px 0 0 0; font-size: 22px; font-weight: bold; color: #dc2626; font-family: 'Courier New', monospace;">${data.confirmationNumber}</p>
            </div>

            <div style="margin-bottom: 15px;">
              <p style="margin: 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Package</p>
              <p style="margin: 5px 0 0 0; font-size: 16px; color: #1f2937; font-weight: 500;">${data.packageType}</p>
            </div>

            <div style="margin-bottom: 15px;">
              <p style="margin: 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Original Booking Date</p>
              <p style="margin: 5px 0 0 0; font-size: 16px; color: #1f2937; font-weight: 500;">${new Date(data.bookingDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 4px; margin: 30px 0;">
            <p style="font-size: 14px; line-height: 1.6; color: #4b5563; margin: 0;">
              <strong>What happens next?</strong><br>
              If you'd like to rebook or need to discuss this cancellation further, please reach out to us. We'd be happy to help reschedule your booking or answer any questions you may have.
            </p>
          </div>

          <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin: 30px 0;">
            We value your interest and hope to work with you in the future.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #1f2937; color: white; padding: 30px 20px; text-align: center; border-radius: 0 0 8px 8px;">
          <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">Timeless Media Studio</p>
          <p style="margin: 0; font-size: 12px; opacity: 0.8;">Professional Photography & Media Services</p>
          <p style="margin: 15px 0 0 0; font-size: 11px; opacity: 0.6;">If you did not expect this email, please contact us immediately</p>
        </div>
      </div>
    `,
  };
}
