import nodemailer from "nodemailer";

type Receipt = {
  packageName: string;
  packagePrice: number;
  subtotal: number;
  total: number;
  paidStatus: "cash_on_site" | "pending_online_payment";
};

type BookingRequest = {
  name: string;
  email: string;
  emailProvider?: string;
  phone: string;
  date: string;
  packageType: string;
  message?: string;
  confirmationNumber: string;
  paymentMethod?: string;
  receipt?: Receipt;
  status?: "pending" | "approved" | "cancelled";
};

export async function sendBookingEmail(booking: BookingRequest) {
  console.log(`\n📧 ===== UTILITY: sendBookingEmail START =====`);
  console.log(`Recipient: ${booking.email}`);
  console.log(`Status: ${booking.status}`);
  
  // Validate environment variables
  if (
    !process.env.EMAIL_HOST ||
    !process.env.EMAIL_PORT ||
    !process.env.EMAIL_USER ||
    !process.env.EMAIL_PASSWORD
  ) {
    const missingVars = {
      EMAIL_HOST: !!process.env.EMAIL_HOST,
      EMAIL_PORT: !!process.env.EMAIL_PORT,
      EMAIL_USER: !!process.env.EMAIL_USER,
      EMAIL_PASSWORD: !!process.env.EMAIL_PASSWORD,
    };
    console.error(`❌ Missing email environment variables:`, missingVars);
    throw new Error("Missing email environment variables");
  }

  console.log(`✓ Environment variables validated`);

  const portNum = Number(process.env.EMAIL_PORT);
  const isSecure = process.env.EMAIL_SECURE === "true" || portNum === 465;

  console.log("📧 Email Configuration:", {
    host: process.env.EMAIL_HOST,
    port: portNum,
    secure: isSecure,
    user: process.env.EMAIL_USER?.substring(0, 5) + "***",
    environment: process.env.NODE_ENV,
    isVercel: !!process.env.VERCEL_URL,
  });

  // For Vercel: prefer port 465 (SSL) over 587 (STARTTLS) as Vercel blocks STARTTLS
  let finalPort = portNum;
  let finalSecure = isSecure;

  if (process.env.VERCEL_URL && portNum === 587) {
    console.log("⚠️  Vercel detected with port 587. Using SSL (port 465).");
    finalPort = 465;
    finalSecure = true;
  }

  const transportConfig = {
    host: process.env.EMAIL_HOST,
    port: finalPort,
    secure: finalSecure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    connectionTimeout: 10000,
    socketTimeout: 10000,
  };

  console.log(`🔌 Creating transporter with port ${finalPort}, secure: ${finalSecure}`);
  const transporter = nodemailer.createTransport(transportConfig);

  // Verify SMTP connection
  try {
    console.log("🔍 Verifying SMTP connection...");
    await transporter.verify();
    console.log("✓ SMTP connection verified successfully");
  } catch (verifyError) {
    console.error(
      "❌ SMTP verification failed:",
      verifyError instanceof Error ? verifyError.message : verifyError
    );
    throw new Error(
      `SMTP connection failed: ${verifyError instanceof Error ? verifyError.message : "Unknown error"}`
    );
  }

  // Determine email subject and status message based on booking status
  let emailSubject = `Booking Confirmation - ${booking.confirmationNumber}`;
  let statusMessage = "PENDING APPROVAL";
  let statusColor = "#00ff99";

  if (booking.status === "approved") {
    emailSubject = `✓ Your Booking Has Been Approved - ${booking.confirmationNumber}`;
    statusMessage = "APPROVED";
    statusColor = "#00ff99";
  } else if (booking.status === "cancelled") {
    emailSubject = `✗ Your Booking Has Been Cancelled - ${booking.confirmationNumber}`;
    statusMessage = "CANCELLED";
    statusColor = "#ff4444";
  }

  console.log(`📝 Email Template:`, {
    subject: emailSubject,
    statusMessage,
    hasReceipt: !!booking.receipt,
  });

  const receiptHtml = booking.receipt
    ? `
      <div
        style="
          background:#1a1a1a;
          padding:20px;
          border-radius:14px;
          margin-top:20px;
        "
      >
        <h2
          style="
            margin-top:0;
            color:#ffffff;
          "
        >
          Receipt Summary
        </h2>

        <table
          style="
            width:100%;
            border-collapse:collapse;
            color:#ddd;
          "
        >
          <tr>
            <td style="padding:8px 0;">
              Package
            </td>

            <td
              style="
                padding:8px 0;
                text-align:right;
              "
            >
              ${booking.receipt.packageName}
            </td>
          </tr>

          <tr>
            <td style="padding:8px 0;">
              Package Price
            </td>

            <td
              style="
                padding:8px 0;
                text-align:right;
              "
            >
              ₱${booking.receipt.packagePrice}
            </td>
          </tr>

          <tr>
            <td style="padding:8px 0;">
              Subtotal
            </td>

            <td
              style="
                padding:8px 0;
                text-align:right;
              "
            >
              ₱${booking.receipt.subtotal}
            </td>
          </tr>

          <tr
            style="
              border-top:1px solid #444;
            "
          >
            <td
              style="
                padding:12px 0;
                font-weight:bold;
              "
            >
              Total
            </td>

            <td
              style="
                padding:12px 0;
                text-align:right;
                font-weight:bold;
              "
            >
              ₱${booking.receipt.total}
            </td>
          </tr>
        </table>
      </div>
    `
    : "";

  // Send email with proper error handling
  let mailResult;
  try {
    console.log(`\n📤 ===== SENDING EMAIL START =====`);
    console.log(`To: ${booking.email}`);
    console.log(`Subject: ${emailSubject}`);
    console.log(`Size: ${emailSubject.length} chars`);
    console.log(`🔐 Using auth: ${process.env.EMAIL_USER?.substring(0, 5)}***`);

    mailResult = await transporter.sendMail({
      from: `"Timeless Media Studio" <${process.env.EMAIL_USER}>`,
      to: booking.email,
      subject: emailSubject,
      html: `
        <div
          style="
            max-width:700px;
            margin:auto;
            background:#111111;
            color:#ffffff;
            font-family:Arial,sans-serif;
            border-radius:18px;
            overflow:hidden;
            border:1px solid #2b2b2b;
          "
        >
          <div
            style="
              background:linear-gradient(
                135deg,
                #000000,
                #2a2a2a
              );
              padding:40px 24px;
              text-align:center;
            "
          >
            <h1
              style="
                margin:0;
                font-size:32px;
                color:${statusColor};
              "
            >
              ${statusMessage}
            </h1>

            <p
              style="
                margin:8px 0 0 0;
                color:#aaa;
                font-size:14px;
              "
            >
              Confirmation #:
              ${booking.confirmationNumber}
            </p>
          </div>

          <div
            style="
              padding:40px 24px;
            "
          >
            <h2
              style="
                margin-top:0;
                font-size:20px;
                color:#ffffff;
              "
            >
              Hello ${booking.name},
            </h2>

            ${
              booking.status === "cancelled"
                ? `
              <p
                style="
                  color:#ff9999;
                  line-height:1.6;
                  font-size:14px;
                  margin-bottom:20px;
                "
              >
                We regret to inform you that your booking has been cancelled. We understand this may be disappointing, and we sincerely apologize for any inconvenience. If you have any questions or would like to reschedule, please don't hesitate to contact us.
              </p>
            `
                : `
              <p
                style="
                  color:#ddd;
                  line-height:1.6;
                  font-size:14px;
                "
              >
                Thank you for choosing Timeless Media Studio! We're excited to work with you on your event.
              </p>
            `
            }

            <div
              style="
                background:#0d0d0d;
                padding:20px;
                border-radius:10px;
                margin:20px 0;
                border-left:4px solid ${statusColor};
              "
            >
              <h3
                style="
                  margin-top:0;
                  color:#ffffff;
                  font-size:14px;
                "
              >
                Booking Details
              </h3>

              <table
                style="
                  width:100%;
                  border-collapse:collapse;
                "
              >
                <tr>
                  <td
                    style="
                      padding:6px 0;
                      color:#aaa;
                    "
                  >
                    Name
                  </td>

                  <td
                    style="
                      padding:6px 0;
                      text-align:right;
                      color:#fff;
                    "
                  >
                    ${booking.name}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:6px 0;
                      color:#aaa;
                    "
                  >
                    Email
                  </td>

                  <td
                    style="
                      padding:6px 0;
                      text-align:right;
                      color:#fff;
                    "
                  >
                    ${booking.email}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:6px 0;
                      color:#aaa;
                    "
                  >
                    Phone
                  </td>

                  <td
                    style="
                      padding:6px 0;
                      text-align:right;
                      color:#fff;
                    "
                  >
                    ${booking.phone}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:6px 0;
                      color:#aaa;
                    "
                  >
                    Booking Date
                  </td>

                  <td
                    style="
                      padding:6px 0;
                      text-align:right;
                      color:#fff;
                    "
                  >
                    ${new Date(booking.date).toLocaleDateString()}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:6px 0;
                      color:#aaa;
                    "
                  >
                    Package
                  </td>

                  <td
                    style="
                      padding:6px 0;
                      text-align:right;
                      color:#fff;
                    "
                  >
                    ${booking.packageType}
                  </td>
                </tr>
              </table>
            </div>

            ${receiptHtml}

            <div
              style="
                margin-top:28px;
                background:#0d0d0d;
                border-left:4px solid #ffffff;
                padding:18px;
                border-radius:10px;
              "
            >
              <p
                style="
                  margin:0;
                  color:#d8d8d8;
                  line-height:1.6;
                "
              >
                Please save your
                confirmation number for
                booking tracking and
                future support inquiries.
              </p>
            </div>
          </div>

          <div
            style="
              background:#080808;
              padding:20px;
              text-align:center;
              border-top:1px solid #2b2b2b;
            "
          >
            <p
              style="
                margin:0;
                color:#8f8f8f;
                font-size:13px;
              "
            >
              This is an automated
              booking confirmation email.
            </p>
          </div>
        </div>
      `,
    });

  console.log(`✅ Email sent successfully to ${booking.email}`);
    console.log(`   Message ID: ${mailResult.messageId}`);
    console.log(`   Response: ${mailResult.response}`);
    console.log(`📧 ===== UTILITY: sendBookingEmail SUCCESS =====\n`);

    return {
      success: true,
      confirmationNumber: booking.confirmationNumber,
      message: `${booking.status === "approved" ? "Approval" : booking.status === "cancelled" ? "Cancellation" : "Confirmation"} email sent successfully to ${booking.email}`,
      messageId: mailResult.messageId,
    };
  } catch (sendError) {
    console.error(`\n❌ ===== UTILITY: sendBookingEmail FAILED =====`);
    console.error(`❌ Email send error for ${booking.email}:`);
    console.error(
      `   Error Type: ${sendError instanceof Error ? sendError.name : typeof sendError}`
    );
    console.error(
      `   Error Message: ${sendError instanceof Error ? sendError.message : String(sendError)}`
    );
    console.error(`   Full Error:`, sendError);

    // Log additional debugging info
    interface ErrorWithCode extends Error {
      code?: string;
    }

    if (sendError instanceof Error) {
      const err = sendError as ErrorWithCode;
      if (err.code) {
        console.error(`   Error Code: ${err.code}`);
      }
      if (err.stack) {
        console.error(`   Stack:`, err.stack);
      }
    }
    
    console.error(`❌ ===== UTILITY: sendBookingEmail FAILED =====\n`);
    throw sendError;
  }
}
