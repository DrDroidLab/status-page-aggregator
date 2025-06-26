import { type ServiceStatusData } from "./status";
import nodemailer from "nodemailer";

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Email configuration - update these with your actual credentials
const EMAIL_CONFIG: EmailConfig = {
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || "your-actual-email@gmail.com", // Replace with your actual email
    pass: process.env.EMAIL_PASS || "your-actual-app-password", // Replace with your actual app password
  },
};

const SLACK_EMAIL =
  process.env.SLACK_EMAIL ||
  "clerk_updates-aaaaqs4l7lp4cfjbnrpxpti3v4@deep-sea-global.slack.com";

function getStatusColor(status: string): string {
  switch (status) {
    case "operational":
      return "green";
    case "degraded":
    case "incident":
      return "orange";
    case "outage":
      return "red";
    case "maintenance":
      return "blue";
    default:
      return "gray";
  }
}

export async function sendIncidentNotification(
  serviceName: string,
  statusData: ServiceStatusData
): Promise<boolean> {
  try {
    const transporter = nodemailer.createTransport(EMAIL_CONFIG);

    const subject = `🚨 ${serviceName} Service Incident Detected`;

    let incidentDetails = "";
    if (statusData.lastIncident) {
      incidentDetails = `
Latest Incident:
- Title: ${statusData.lastIncident.title}
- Status: ${statusData.lastIncident.status}
- Description: ${statusData.lastIncident.description}
- Created: ${statusData.lastIncident.createdAt}
- Updated: ${statusData.lastIncident.updatedAt}
      `;
    }

    const emailBody = `
Service Status Alert

Service: ${serviceName}
Current Status: ${statusData.status.toUpperCase()}
${incidentDetails}

This is an automated notification from your status monitoring system.

Time: ${new Date().toISOString()}
    `;

    const mailOptions = {
      from: EMAIL_CONFIG.auth.user,
      to: SLACK_EMAIL,
      subject: subject,
      text: emailBody,
      html: `
        <h2>🚨 Service Status Alert</h2>
        <p><strong>Service:</strong> ${serviceName}</p>
        <p><strong>Current Status:</strong> <span style="color: ${getStatusColor(
          statusData.status
        )}">${statusData.status.toUpperCase()}</span></p>
        ${
          statusData.lastIncident
            ? `
        <h3>Latest Incident:</h3>
        <ul>
          <li><strong>Title:</strong> ${statusData.lastIncident.title}</li>
          <li><strong>Status:</strong> ${statusData.lastIncident.status}</li>
          <li><strong>Description:</strong> ${statusData.lastIncident.description}</li>
          <li><strong>Created:</strong> ${statusData.lastIncident.createdAt}</li>
          <li><strong>Updated:</strong> ${statusData.lastIncident.updatedAt}</li>
        </ul>
        `
            : ""
        }
        <p><em>This is an automated notification from your status monitoring system.</em></p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      `,
    };

    // Log the attempt for debugging
    console.log("📧 SENDING EMAIL NOTIFICATION:");
    console.log("To:", SLACK_EMAIL);
    console.log("Subject:", subject);
    console.log("From:", EMAIL_CONFIG.auth.user);

    await transporter.sendMail(mailOptions);
    console.log(
      `✅ Incident notification sent successfully for ${serviceName}`
    );
    return true;
  } catch (error) {
    console.error(`❌ Failed to send notification for ${serviceName}:`, error);
    return false;
  }
}
