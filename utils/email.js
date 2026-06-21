const fetch = require('node-fetch');

async function sendEmail({ to, subject, html }) {
  if (!process.env.BREVO_API_KEY) {
    console.warn('BREVO_API_KEY not set - skipping email send');
    return;
  }
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: process.env.SITE_NAME || 'Shanti Bryan Pinschers', email: process.env.NOTIFY_EMAIL },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('Brevo send failed:', res.status, text);
    }
  } catch (err) {
    console.error('Email send error:', err.message);
  }
}

function newInquiryEmail(inquiry) {
  return `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color:#2B1B14;">
      <h2 style="color:#7A3A1D;">New inquiry received</h2>
      <p><strong>Name:</strong> ${inquiry.name}</p>
      <p><strong>Email:</strong> ${inquiry.email}</p>
      <p><strong>Phone:</strong> ${inquiry.phone || '—'}</p>
      ${inquiry.puppyName ? `<p><strong>Regarding:</strong> ${inquiry.puppyName}</p>` : ''}
      <p><strong>Message:</strong></p>
      <p style="white-space:pre-wrap; border-left:3px solid #B5562B; padding-left:12px;">${inquiry.message}</p>
      <p style="margin-top:24px; font-size:13px; color:#7A6A5C;">Log in to the admin dashboard to reply.</p>
    </div>
  `;
}

module.exports = { sendEmail, newInquiryEmail };
