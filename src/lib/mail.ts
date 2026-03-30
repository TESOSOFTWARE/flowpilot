import nodemailer from "nodemailer"
import fs from 'fs'

const LOG_FILE = '/tmp/api_debug.log'

function log(message: string) {
  const timestamp = new Date().toISOString()
  fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`)
}

interface SendInviteParams {
  email: string
  role: string
  orgName: string
  inviteLink: string
}

export async function sendTeamInviteEmail({ email, role, orgName, inviteLink }: SendInviteParams) {
  // If no SMTP settings are provided, use Ethereal (fake SMTP) to catch emails for development
  let transporter;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort || 587,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })
  } else {
    // Fallback to test account if no real SMTP configured
    // This is useful for development
    console.warn("No SMTP configuration found. Creating ethereal test account...");
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"TinyBee" <noreply@tinybee.app>',
    to: email,
    subject: `You have been invited to join ${orgName} on TinyBee`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0f172a; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">TinyBee</h1>
        </div>
        <div style="padding: 32px; background-color: #ffffff;">
          <h2 style="color: #0f172a; margin-top: 0;">You're Invited!</h2>
          <p style="color: #475569; line-height: 1.6;">
            You have been invited to join the <strong>${orgName}</strong> team on TinyBee as a <strong>${role}</strong>.
          </p>
          <p style="color: #475569; line-height: 1.6;">
            TinyBee is a comprehensive project management suite designed to help teams collaborate effectively.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${inviteLink}" style="background-color: #3b82f6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Accept Invitation</a>
          </div>
          <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">
            If the button doesn't work, copy and paste this link into your browser:
            <br>
            <a href="${inviteLink}" style="color: #3b82f6; word-break: break-all;">${inviteLink}</a>
          </p>
        </div>
        <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            &copy; ${new Date().getFullYear()} TinyBee. All rights reserved.
          </p>
        </div>
      </div>
    `,
  }

  const info = await transporter.sendMail(mailOptions)
  
  if (!smtpHost) {
    const previewUrl = nodemailer.getTestMessageUrl(info)
    console.log("Preview URL: %s", previewUrl);
    log(`[EMAIL] Preview URL for ${email}: ${previewUrl}`)
  } else {
    log(`[EMAIL] Successfully sent real email to ${email}. MessageId: ${info.messageId}`)
  }
  
  return info
}
