const nodemailer = require('nodemailer');

/**
 * Create email transporter
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} options.html - HTML body
 */
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email error:', error.message);
    throw error;
  }
};

/**
 * Send SOS alert email
 */
const sendSOSAlertEmail = async (user, location, emergencyContacts) => {
  const googleMapsUrl = `https://www.google.com/maps?q=${location.coordinates[1]},${location.coordinates[0]}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .alert-header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .btn { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .location { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="alert-header">
          <h1>🚨 EMERGENCY SOS ALERT</h1>
        </div>
        <div class="content">
          <p><strong>${user.name}</strong> has triggered an emergency SOS alert and needs immediate help!</p>
          
          <div class="location">
            <h3>📍 Location</h3>
            <p>Latitude: ${location.coordinates[1]}</p>
            <p>Longitude: ${location.coordinates[0]}</p>
            ${location.address ? `<p>Address: ${location.address}</p>` : ''}
          </div>
          
          <p><a href="${googleMapsUrl}" class="btn">View Location on Map</a></p>
          
          <h3>Contact Information</h3>
          <p>Phone: ${user.phone}</p>
          <p>Email: ${user.email}</p>
          
          <p style="color: #dc2626; font-weight: bold;">Please take immediate action to help!</p>
          
          <hr>
          <p style="font-size: 12px; color: #666;">
            This is an automated emergency alert from LifeLine Safety System.
            Time: ${new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Send to all emergency contacts
  for (const contact of emergencyContacts) {
    try {
      await sendEmail({
        to: contact.email || `${contact.phone}@sms-gateway.com`, // Placeholder for SMS gateway
        subject: `🚨 EMERGENCY: ${user.name} needs help!`,
        html,
        text: `EMERGENCY SOS ALERT!\n\n${user.name} has triggered an emergency alert.\n\nLocation: ${googleMapsUrl}\n\nPlease take immediate action!`,
      });
    } catch (error) {
      console.error(`Failed to send alert to ${contact.name}:`, error.message);
    }
  }
};

/**
 * Send ambulance dispatch email
 */
const sendAmbulanceDispatchEmail = async (emergency, hospital) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚑 Ambulance Request</h1>
        </div>
        <div class="content">
          <h3>Emergency Details</h3>
          <p><strong>Request ID:</strong> ${emergency.requestId}</p>
          <p><strong>Type:</strong> ${emergency.type}</p>
          <p><strong>Priority:</strong> ${emergency.priority}</p>
          
          <h3>Patient Information</h3>
          <p><strong>Name:</strong> ${emergency.patientInfo.name}</p>
          <p><strong>Age:</strong> ${emergency.patientInfo.age || 'Not provided'}</p>
          <p><strong>Condition:</strong> ${emergency.patientInfo.condition || 'Not provided'}</p>
          
          <h3>Pickup Location</h3>
          <p>${emergency.pickupLocation.address || 'See coordinates'}</p>
          <p>
            <a href="https://www.google.com/maps?q=${emergency.pickupLocation.coordinates[1]},${emergency.pickupLocation.coordinates[0]}">
              View on Map
            </a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: hospital.contact.email,
    subject: `🚑 Ambulance Request - ${emergency.requestId}`,
    html,
    text: `Ambulance Request ${emergency.requestId}\n\nPatient: ${emergency.patientInfo.name}\nPriority: ${emergency.priority}`,
  });
};

module.exports = {
  sendEmail,
  sendSOSAlertEmail,
  sendAmbulanceDispatchEmail,
};
