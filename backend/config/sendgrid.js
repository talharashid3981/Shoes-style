import sgMail from '@sendgrid/mail';

// ✅ dotenv is loaded in server.js before this module is imported
// Do NOT call dotenv.config() here

if (!process.env.SENDGRID_API_KEY) {
  console.warn('⚠️  SENDGRID_API_KEY is not set. Email sending will fail.');
} else {
  // ✅ CRITICAL FIX: NEVER log API keys. Original code logged the key TWICE.
  // Anyone with access to your server logs could steal the key and send
  // emails from your domain or rack up billing charges.
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export default sgMail;