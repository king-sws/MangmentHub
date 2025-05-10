import { WELCOME_EMAIL_TEMPLATE } from "./emailtimplate";
import transporter from "./nodemailer";

/**
 * Sends a welcome email to a new user
 * @param email The recipient's email address
 * @param name The recipient's name
 */
export const SendWelcomeEmail = async (email: string, name: string): Promise<void> => {
    const mailOptions = {
        from: `Bookif ${process.env.SENDLER_USER as string}`, // Professional format
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