import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  // In development, use a disposable Ethereal account so no real email is sent.
  // The preview URL is logged to the console for inspection.
  const testAccount = await nodemailer.createTestAccount();

  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  return transporter;
}

export async function sendPasswordChangedEmail(to: string, name: string): Promise<void> {
  try {
    const t = await getTransporter();

    const info = await t.sendMail({
      from:    '"Secure Workspace" <no-reply@secureworkspace.example.com>',
      to,
      subject: 'Your password was changed',
      text: [
        `Hi ${name},`,
        '',
        'Your Secure Workspace password was just changed.',
        'If you did not request this change, contact us immediately:',
        '',
        '  Email: support@secureworkspace.example.com',
        '  Phone: 1-800-555-0147',
      ].join('\n'),
      html: `
        <p>Hi <strong>${name}</strong>,</p>
        <p>Your Secure Workspace password was just changed.</p>
        <p>If you did not request this change, contact us immediately:</p>
        <ul>
          <li>Email: <a href="mailto:support@secureworkspace.example.com">support@secureworkspace.example.com</a></li>
          <li>Phone: 1-800-555-0147</li>
        </ul>
      `,
    });

    // Log the Ethereal preview URL in development so the email can be inspected
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[mailer] Password-changed email preview: ${previewUrl}`);
    }
  } catch (err) {
    // Never let mailer failures break the password-change response
    console.error('[mailer] Failed to send password-changed email:', err);
  }
}
