// DEPRECATED - DISABLED BY DEFAULT
// This script CAUSES DUPLICATE EMAILS when used with npm start
// 
// For production use: npm start (which runs src/index.js)
// This is an ALTERNATIVE implementation for Airtable-only sending
// Only enable if you disable Node.js automation completely

throw new Error('Airtable Automation is DISABLED. Use npm start instead to avoid duplicate emails.\nThis is a bonus alternative implementation but causes duplicates when running simultaneously.');

/* ===== ORIGINAL CODE (DISABLED) =====
// Airtable Automation Script - MailerSend Integration
// Paste this into Airtable Automation script editor

// Input variables (set these in the Automation configuration)
const config = input.config();
const MAILERSEND_API_KEY = config.mailerSendApiKey;
const FROM_EMAIL = config.fromEmail;
const FROM_NAME = config.fromName || 'Weekday Interview Team';
const TABLE_NAME = config.tableName || 'Interview_Rounds';
const VIEW_NAME = config.viewName || null; // optional: create a view filtered to Pending

if (!MAILERSEND_API_KEY || !FROM_EMAIL) {
  throw new Error('Missing MailerSend API key or From email in automation config.');
}

const table = base.getTable(TABLE_NAME);
const query = await table.selectRecordsAsync({
  fields: [
    'Company',
    'Interviewer',
    'Candidate',
    'Candidate Email',
    'Round Number',
    'Calendly Link',
    'Added On',
    'Email Status',
    'Email Sent At',
    'TAT (hours)',
    'TAT (readable)',
    'Error Message'
  ],
  ...(VIEW_NAME ? { view: VIEW_NAME } : {})
});

function msToReadable(ms) {
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours || days) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return parts.join(' ');
}

for (const rec of query.records) {
  if (rec.getCellValue('Email Status') !== 'Pending') continue;

  const candidateEmail = rec.getCellValue('Candidate Email');
  const candidate = rec.getCellValue('Candidate');
  const company = rec.getCellValue('Company');
  const interviewer = rec.getCellValue('Interviewer');
  const roundNumber = rec.getCellValue('Round Number');
  const calendlyLink = rec.getCellValue('Calendly Link');

  const subject = `Interview Invitation: ${company} - Round ${roundNumber}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #111827; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: #fff; padding: 16px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #F9FAFB; padding: 24px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; }
        .details { background: #fff; padding: 16px; border-radius: 6px; margin: 16px 0; border: 1px solid #E5E7EB; }
        .row { display: flex; justify-content: space-between; padding: 6px 0; }
        .label { font-weight: bold; color: #6B7280; }
        .footer { font-size: 12px; color: #6B7280; margin-top: 16px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h2>Interview Invitation</h2></div>
        <div class="content">
          <p>Dear ${candidate},</p>
          <p>You have been shortlisted for an interview with <strong>${company}</strong>.</p>
          <div class="details">
            <div class="row"><span class="label">Company</span><span>${company}</span></div>
            <div class="row"><span class="label">Interviewer</span><span>${interviewer || 'TBA'}</span></div>
            <div class="row"><span class="label">Round</span><span>Round ${roundNumber}</span></div>
          </div>
          <p>Please schedule your interview:</p>
          <p><a class="button" href="${calendlyLink}">Schedule Interview</a></p>
          <div class="footer">This is an automated message from Weekday.</div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Interview Invitation\n\nCompany: ${company}\nInterviewer: ${interviewer || 'TBA'}\nRound: ${roundNumber}\nCalendly: ${calendlyLink}`;

  const emailPayload = {
    from: { email: FROM_EMAIL, name: FROM_NAME },
    to: [{ email: candidateEmail, name: candidate }],
    subject,
    html,
    text
  };

  try {
    const resp = await fetch('https://api.mailersend.com/v1/email', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${MAILERSEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    const contentType = resp.headers.get('content-type') || '';
    const bodyText = await resp.text();
    const errorPayload = contentType.includes('application/json') ? JSON.parse(bodyText) : { message: bodyText };

    if (!resp.ok) {
      const msg = errorPayload.message || bodyText || 'MailerSend error';
      await table.updateRecordAsync(rec.id, {
        'Email Status': 'Failed',
        'Error Message': String(msg).slice(0, 500)
      });
      continue;
    }

    const sentAt = new Date();
    const addedOn = rec.getCellValue('Added On');
    let fields = {
      'Email Status': 'Sent',
      'Email Sent At': sentAt.toISOString(),
      'Error Message': null
    };

    if (addedOn) {
      const diffMs = sentAt.getTime() - new Date(addedOn).getTime();
      const hours = Math.round((diffMs / 36e5) * 100) / 100;
      fields['TAT (hours)'] = hours;
      fields['TAT (readable)'] = msToReadable(diffMs);
    }

    await table.updateRecordAsync(rec.id, fields);
  } catch (e) {
    await table.updateRecordAsync(rec.id, {
      'Email Status': 'Failed',
      'Error Message': String(e).slice(0, 500)
    });
  }
}

===== END OF DISABLED CODE =====
*/
