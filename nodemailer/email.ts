import { WELCOME_EMAIL_TEMPLATE } from "./emailtimplate";
import transporter from "./nodemailer";

/**
 * Sends a welcome email to a new user
 * @param email The recipient's email address
 * @param name The recipient's name
 */
export const SendWelcomeEmail = async (email: string, name: string): Promise<void> => {
    const mailOptions = {
        from: `Blutto ${process.env.SENDLER_USER as string}`, // Professional format
        to: email,
        subject: "Welcome to Our Platform!",
        html: WELCOME_EMAIL_TEMPLATE.replace("{userName}", name)
    };

    try {
        // Send email with error handling
        await transporter.sendMail(mailOptions);
        console.log(`📧 Welcome email sent to ${email}`);
    } catch (error) {
        console.error(`Error sending welcome email to ${email}:`, error);
        throw error;
    }
};


export async function sendInvitationEmail(
    email: string,
    workspaceName: string,
    inviteUrl: string
  ) {
    try {
      const result = await transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'Workspace'}" <${process.env.EMAIL_FROM_ADDRESS || 'noreply@example.com'}>`,
        to: email,
        subject: `You're invited to join ${workspaceName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">You've been invited!</h2>
            <p>You've been invited to join <strong>${workspaceName}</strong>.</p>
            <p>Click the button below to accept the invitation:</p>
            <div style="margin: 25px 0;">
              <a 
                href="${inviteUrl}" 
                style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;"
              >
                Accept Invitation
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">This invitation will expire in 72 hours.</p>
            <p style="color: #666; font-size: 12px;">If you can't click the button, copy and paste this URL into your browser: ${inviteUrl}</p>
          </div>
        `,
      });
      
      console.log('📧 Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  // Add this to your nodemailer/email.ts file

export const SendPasswordResetEmail = async (
  email: string, 
  name: string, 
  resetToken: string
) => {
  try {
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      // Fix: Use the same format as your working functions
      from: `"${process.env.EMAIL_FROM_NAME || 'Blutto'}" <${process.env.EMAIL_FROM_ADDRESS || process.env.SENDLER_USER}>`,
      to: email,
      subject: "Reset Your Password - Blutto",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; text-align: center;">Reset Your Password</h1>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">Hello ${name},</h2>
            
            <p>We received a request to reset your password for your Blutto account. If you didn't make this request, you can safely ignore this email.</p>
            
            <p>To reset your password, click the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="background: #f8f9fa; padding: 10px; border-radius: 4px; word-break: break-all;">
              ${resetUrl}
            </p>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              This link will expire in 1 hour for security purposes.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #666; font-size: 12px; text-align: center;">
              If you're having trouble with the button above, copy and paste the URL into your web browser.
            </p>
            
            <p style="color: #666; font-size: 12px; text-align: center;">
              Best regards,<br>
              The Blutto Team
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        Hello ${name},
        
        We received a request to reset your password for your Blutto account.
        
        To reset your password, visit: ${resetUrl}
        
        This link will expire in 1 hour for security purposes.
        
        If you didn't request this, you can safely ignore this email.
        
        Best regards,
        The Blutto Team
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('📧 Password reset email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
};