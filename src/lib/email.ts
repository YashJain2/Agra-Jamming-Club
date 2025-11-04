import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can use other services like SendGrid, Mailgun, etc.
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASS, // Your email password or app password
  },
});

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    const mailOptions = {
      from: `"Agra Jamming Club" <${process.env.EMAIL_USER}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return false;
  }
}

// Email templates
export const emailTemplates = {
  // Guest Ticket Confirmation
  guestTicketConfirmation: (guestDetails: any, ticketDetails: any, eventDetails: any) => ({
    subject: `🎫 Ticket Confirmed - ${eventDetails.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🎫 Ticket Confirmed!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Agra Jamming Club</p>
        </div>
        
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Hello ${guestDetails.name}!</h2>
          
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 25px;">
            Your ticket for <strong>${eventDetails.title}</strong> has been successfully booked! 
            We're excited to see you at the event.
          </p>
          
          <div style="background: white; border-radius: 8px; padding: 25px; margin-bottom: 25px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h3 style="color: #1f2937; margin-bottom: 15px;">📋 Event Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Event:</td>
                <td style="padding: 8px 0; color: #1f2937;"><strong>${eventDetails.title}</strong></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Date:</td>
                <td style="padding: 8px 0; color: #1f2937;">${new Date(eventDetails.date).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Time:</td>
                <td style="padding: 8px 0; color: #1f2937;">${eventDetails.time}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Venue:</td>
                <td style="padding: 8px 0; color: #1f2937;">${eventDetails.venue}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Tickets:</td>
                <td style="padding: 8px 0; color: #1f2937;">${ticketDetails.quantity}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Total Paid:</td>
                <td style="padding: 8px 0; color: #1f2937;"><strong>₹${ticketDetails.totalPrice}</strong></td>
              </tr>
            </table>
          </div>
          
          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #92400e; margin-bottom: 10px;">📱 Important Information</h3>
            <ul style="color: #92400e; margin: 0; padding-left: 20px;">
              <li>Please arrive 15 minutes before the event starts</li>
              <li>Bring a valid ID for verification</li>
              <li>Show this email or your ticket QR code at the entrance</li>
              <li>Contact us if you have any questions</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 15px;">
              Want to create an account to manage your tickets easily?
            </p>
            <a href="${process.env.NEXTAUTH_URL}/auth/signup?email=${guestDetails.email}&name=${encodeURIComponent(guestDetails.name)}" 
               style="background: #ec4899; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
              Create Account
            </a>
          </div>
        </div>
        
        <div style="background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>© 2024 Agra Jamming Club. All rights reserved.</p>
          <p>Contact: info@agrajammingclub.com | Phone: 7983301442 - whatsapp only</p>
        </div>
      </div>
    `,
    text: `
      Ticket Confirmed - ${eventDetails.title}
      
      Hello ${guestDetails.name}!
      
      Your ticket for ${eventDetails.title} has been successfully booked!
      
      Event Details:
      - Event: ${eventDetails.title}
      - Date: ${new Date(eventDetails.date).toLocaleDateString()}
      - Time: ${eventDetails.time}
      - Venue: ${eventDetails.venue}
      - Tickets: ${ticketDetails.quantity}
      - Total Paid: ₹${ticketDetails.totalPrice}
      
      Important Information:
      - Please arrive 15 minutes before the event starts
      - Bring a valid ID for verification
      - Show this email or your ticket QR code at the entrance
      - Contact us if you have any questions
      
      Want to create an account? Visit: ${process.env.NEXTAUTH_URL}/auth/signup
      
      © 2024 Agra Jamming Club
    `
  }),

  // Guest Subscription Confirmation
  guestSubscriptionConfirmation: (guestDetails: any, subscriptionDetails: any, planDetails: any) => ({
    subject: `🎉 Subscription Activated - ${planDetails.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #8b5cf6, #ec4899); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🎉 Welcome to Agra Jamming Club!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your subscription is now active</p>
        </div>
        
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Hello ${guestDetails.name}!</h2>
          
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 25px;">
            Congratulations! Your <strong>${planDetails.name}</strong> subscription has been successfully activated. 
            You now have access to all our premium features and events.
          </p>
          
          <div style="background: white; border-radius: 8px; padding: 25px; margin-bottom: 25px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h3 style="color: #1f2937; margin-bottom: 15px;">📋 Subscription Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Plan:</td>
                <td style="padding: 8px 0; color: #1f2937;"><strong>${planDetails.name}</strong></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Duration:</td>
                <td style="padding: 8px 0; color: #1f2937;">${planDetails.duration} months</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Price:</td>
                <td style="padding: 8px 0; color: #1f2937;"><strong>₹${subscriptionDetails.price}</strong></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Start Date:</td>
                <td style="padding: 8px 0; color: #1f2937;">${new Date(subscriptionDetails.startDate).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">End Date:</td>
                <td style="padding: 8px 0; color: #1f2937;">${new Date(subscriptionDetails.endDate).toLocaleDateString()}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #065f46; margin-bottom: 15px;">🎁 What's Included</h3>
            <ul style="color: #065f46; margin: 0; padding-left: 20px;">
              ${planDetails.benefits.map((benefit: string) => `<li>${benefit}</li>`).join('')}
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 15px;">
              Want to create an account to manage your subscription?
            </p>
            <a href="${process.env.NEXTAUTH_URL}/auth/signup?email=${guestDetails.email}&name=${encodeURIComponent(guestDetails.name)}" 
               style="background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
              Create Account
            </a>
          </div>
        </div>
        
        <div style="background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>© 2024 Agra Jamming Club. All rights reserved.</p>
          <p>Contact: info@agrajammingclub.com | Phone: 7983301442 - whatsapp only</p>
        </div>
      </div>
    `,
    text: `
      Subscription Activated - ${planDetails.name}
      
      Hello ${guestDetails.name}!
      
      Congratulations! Your ${planDetails.name} subscription has been successfully activated.
      
      Subscription Details:
      - Plan: ${planDetails.name}
      - Duration: ${planDetails.duration} months
      - Price: ₹${subscriptionDetails.price}
      - Start Date: ${new Date(subscriptionDetails.startDate).toLocaleDateString()}
      - End Date: ${new Date(subscriptionDetails.endDate).toLocaleDateString()}
      
      What's Included:
      ${planDetails.benefits.map((benefit: string) => `- ${benefit}`).join('\n')}
      
      Want to create an account? Visit: ${process.env.NEXTAUTH_URL}/auth/signup
      
      © 2024 Agra Jamming Club
    `
  })
};
