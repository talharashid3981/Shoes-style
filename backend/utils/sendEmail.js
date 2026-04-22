import sgMail from '../config/sendgrid.js';

/**
 * Send an email via SendGrid.
 *
 * @param {object} options
 * @param {string} options.to       - Recipient email
 * @param {string} options.subject  - Email subject
 * @param {string} options.html     - HTML body
 * @param {string} [options.from]   - Sender email (defaults to FROM_EMAIL env var)
 * @param {boolean} [options.throwOnError=false]
 *   - When true, the error is re-thrown to the caller.
 *   - Use true for critical flows (forgot-password, order confirmation).
 *   - Leave false for non-critical notifications.
 */
export const sendEmail = async ({
  to,
  subject,
  html,
  from = process.env.FROM_EMAIL,
  throwOnError = false,
}) => {
  if (!from) {
    const msg = 'FROM_EMAIL env variable is not set. Cannot send email.';
    console.error(msg);
    if (throwOnError) throw new Error(msg);
    return;
  }

  try {
    await sgMail.send({ to, from, subject, html });
  } catch (error) {
    const detail = error.response?.body?.errors?.[0]?.message || error.message;
    console.error(`Email send failed to ${to}: ${detail}`);
    if (throwOnError) {
      throw new Error(`Failed to send email: ${detail}`);
    }
  }
};