const nodemailer = require('nodemailer');

// Warn at startup if email credentials are not configured
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your_16_char_app_password_here') {
    console.warn('\n⚠️  WARNING: Gmail SMTP credentials not configured!');
    console.warn('   Set EMAIL_USER and EMAIL_PASS in server/.env');
    console.warn('   Emails will FAIL until this is configured.\n');
}

const emailService = {
    /**
     * Send an email using Gmail SMTP
     * @param {string} to       - Recipient email address
     * @param {string} subject  - Email subject
     * @param {string} text     - Plain text fallback body
     * @param {string} html     - HTML body (rendered in email clients)
     */
    sendEmail: async (to, subject, text, html) => {
        // Validate credentials before attempting to send
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your_16_char_app_password_here') {
            console.error(`❌ Cannot send email to ${to}: Gmail credentials not set in .env`);
            return { success: false, error: 'Email credentials not configured' };
        }

        try {
            // Gmail SMTP transporter
            const transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,          // STARTTLS on port 587
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS  // Must be a Gmail App Password
                },
                tls: {
                    rejectUnauthorized: false      // Allow self-signed certs in dev
                }
            });

            const info = await transporter.sendMail({
                from: `"AI Project Manager" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
                to,
                subject,
                text,
                html
            });

            console.log(`✅ Email delivered to ${to} — ID: ${info.messageId}`);
            return { success: true, messageId: info.messageId };

        } catch (error) {
            console.error(`❌ Email delivery failed for ${to}:`, error.message);

            // Helpful diagnosis for the most common error
            if (error.code === 'EAUTH') {
                console.error('   → AUTH error: Make sure EMAIL_PASS is a Gmail App Password, NOT your account password.');
                console.error('   → Visit: https://myaccount.google.com/apppasswords');
            }
            if (error.code === 'ECONNREFUSED') {
                console.error('   → Connection refused: Check your network or firewall settings.');
            }

            return { success: false, error: error.message };
        }
    },

    /**
     * Send email verification email
     * @param {string} email - User's email
     * @param {string} token - Verification token
     */
    sendVerificationEmail: async (email, token) => {
        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${token}`;

        const subject = 'Verify Your Email - AI Project Manager';
        const text = `
Hello,

Thank you for registering with AI Project Manager!

Please verify your email address by clicking the link below:
${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account, please ignore this email.

Best regards,
AI Project Manager Team
        `;

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Verify Your Email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to AI Project Manager!</h1>
    </div>
    <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-top: 0;">Verify Your Email Address</h2>
        <p>Thank you for registering! Please click the button below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Verify Email</a>
        </div>
        <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
        <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this URL into your browser:</p>
        <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 5px; font-size: 12px;">${verificationUrl}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">If you didn't create an account, please ignore this email.</p>
    </div>
</body>
</html>
        `;

        return await emailService.sendEmail(email, subject, text, html);
    },

    /**
     * Send password reset email
     * @param {string} email - User's email
     * @param {string} token - Reset token
     */
    sendPasswordResetEmail: async (email, token) => {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${token}`;

        const subject = 'Reset Your Password - AI Project Manager';
        const text = `
Hello,

You requested a password reset for your AI Project Manager account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 10 minutes.

If you didn't request this reset, please ignore this email.

Best regards,
AI Project Manager Team
        `;

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Password Reset</h1>
    </div>
    <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
        <p>You requested a password reset for your account. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #666; font-size: 14px;">This link will expire in 10 minutes.</p>
        <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this URL into your browser:</p>
        <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 5px; font-size: 12px;">${resetUrl}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">If you didn't request this reset, please ignore this email.</p>
    </div>
</body>
</html>
        `;

        return await emailService.sendEmail(email, subject, text, html);
    }
};

module.exports = emailService;
