import nodemailer from 'nodemailer';

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: Number(process.env.SMTP_PORT) || 587,
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  });
}

export async function notifyCaregiver(subject: string, body: string): Promise<void> {
  const caregiverEmail = process.env.CAREGIVER_EMAIL || 'sarah@example.com';

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: '"Compass Safety" <compass@noreply.com>',
      to: caregiverEmail,
      subject: `🧭 Compass: ${subject}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1a1a1a;">Compass Alert</h2>
          <div style="background: #f8f8f5; padding: 20px; border-radius: 12px;">
            ${body}
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 16px;">
            View details at <a href="http://localhost:3000/approvals">your Compass dashboard</a>
          </p>
        </div>
      `,
    });
    console.log(`📧 Email sent to ${caregiverEmail}: ${subject}`);
  } catch (err) {
    // Non-fatal — log but don't crash
    console.warn(`⚠️ Email notification failed (non-fatal): ${err}`);
  }
}

export async function notifyBlocked(destination: string, lamports: number, reasons: string[]): Promise<void> {
  const sol = (lamports / 1_000_000_000).toFixed(4);
  await notifyCaregiver(
    'Payment Blocked',
    `<p><strong>A payment was automatically blocked.</strong></p>
     <p><strong>To:</strong> ${destination}</p>
     <p><strong>Amount:</strong> ${sol} SOL</p>
     <p><strong>Reasons:</strong></p>
     <ul>${reasons.map(r => `<li>${r}</li>`).join('')}</ul>`
  );
}

export async function notifyEscalation(pendingId: string, destination: string, lamports: number, reasons: string[]): Promise<void> {
  const sol = (lamports / 1_000_000_000).toFixed(4);
  await notifyCaregiver(
    'Approval Needed',
    `<p><strong>Eleanor wants to make a payment that needs your approval.</strong></p>
     <p><strong>To:</strong> ${destination}</p>
     <p><strong>Amount:</strong> ${sol} SOL</p>
     <p><strong>Why approval is needed:</strong></p>
     <ul>${reasons.map(r => `<li>${r}</li>`).join('')}</ul>
     <p><a href="http://localhost:3000/approvals" style="background: #4a7c59; color: white; padding: 12px 24px; border-radius: 24px; text-decoration: none; display: inline-block; margin-top: 12px;">Review & Approve</a></p>`
  );
}
