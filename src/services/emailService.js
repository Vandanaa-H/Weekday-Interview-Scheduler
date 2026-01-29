class EmailService {
  constructor() {
    this.apiKey = process.env.MAILERSEND_API_KEY;
    this.mailgunKey = process.env.MAILGUN_API_KEY;
    this.provider = process.env.EMAIL_PROVIDER || 'mailersend';
    this.demoMode = process.env.DEMO_MODE === 'true';
  }

  async sendInterviewInvitation(fields) {
    // Demo mode for testing without external APIs
    if (this.demoMode) {
      return this.sendDemo(fields);
    }

    if (this.provider === 'mailgun' && this.mailgunKey) {
      return this.sendViaMailgun(fields);
    }
    return this.sendViaMailerSend(fields);
  }

  async sendDemo(fields) {
    // Simulate successful email send for demo/proof purposes
    const toEmail = fields['Candidate Email'] || fields.candidateEmail;
    
    // Random 100ms delay to simulate API call
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
    
    return {
      success: true,
      sentAt: new Date().toISOString(),
      messageId: `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      demo: true
    };
  }

  async sendViaMailerSend(fields) {
    const fromEmail = process.env.MAILERSEND_FROM_EMAIL;
    const fromName = process.env.MAILERSEND_FROM_NAME || 'Weekday Interview Team';
    const replyToEmail = process.env.MAILERSEND_REPLY_TO || 'noreply@weekday.com';
    const toEmail = fields['Candidate Email'] || fields.candidateEmail;
    const toName = fields.Candidate || fields.candidate;
    const company = fields.Company || fields.company;
    const roundNumber = fields['Round Number'] || fields.roundNumber;

    const emailPayload = {
      from: {
        email: fromEmail,
        name: fromName
      },
      reply_to: {
        email: replyToEmail,
        name: 'Weekday Recruiting'
      },
      to: [
        {
          email: toEmail,
          name: toName
        }
      ],
      subject: `Interview Invitation: ${company} - Round ${roundNumber}`,
      html: this.buildEmailBody(fields),
      text: this.buildPlainTextBody(fields)
    };

    try {
      const response = await fetch('https://api.mailersend.com/v1/email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(emailPayload)
      });

      // MailerSend returns 202 Accepted with empty body on success
      if (response.ok) {
        return {
          success: true,
          sentAt: new Date().toISOString(),
          messageId: response.headers.get('x-message-id') || 'sent'
        };
      }

      // Only parse JSON for error responses
      const responseData = await response.json();
      const errorMsg = this.extractApiError(responseData);
      return { success: false, error: errorMsg };
    } catch (error) {
      return { success: false, error: error.message || 'Network error' };
    }
  }

  async sendViaMailgun(fields) {
    const domain = process.env.MAILGUN_DOMAIN;
    const fromEmail = process.env.MAILGUN_FROM_EMAIL;
    const toEmail = fields['Candidate Email'] || fields.candidateEmail;
    const toName = fields.Candidate || fields.candidate;
    const company = fields.Company || fields.company;
    const roundNumber = fields['Round Number'] || fields.roundNumber;

    const emailBody = this.buildEmailBody(fields);
    const textBody = this.buildPlainTextBody(fields);
    const subject = `Interview Invitation: ${company} - Round ${roundNumber}`;

    const formData = new URLSearchParams();
    formData.append('from', fromEmail);
    formData.append('to', `${toName} <${toEmail}>`);
    formData.append('subject', subject);
    formData.append('html', emailBody);
    formData.append('text', textBody);

    try {
      const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`api:${this.mailgunKey}`).toString('base64')}`
        },
        body: formData
      });

      if (response.status === 401) {
        return { success: false, error: 'Mailgun API key invalid or expired' };
      }

      const responseData = await response.json();

      if (!response.ok) {
        return { success: false, error: responseData.message || 'Mailgun error' };
      }

      return {
        success: true,
        sentAt: new Date().toISOString(),
        messageId: responseData.id || 'sent'
      };
    } catch (error) {
      return { success: false, error: error.message || 'Network error' };
    }
  }

  extractApiError(responseData) {
    if (responseData.message) {
      return responseData.message;
    }
    if (responseData.errors && Array.isArray(responseData.errors)) {
      return responseData.errors.map(e => e.message || e).join(', ');
    }
    return JSON.stringify(responseData);
  }

  buildEmailBody(data) {
    const company = data.Company || data.company;
    const candidate = data.Candidate || data.candidate;
    const interviewer = data.Interviewer || data.interviewer;
    const roundNumber = data['Round Number'] || data.roundNumber;
    const calendlyLink = data['Calendly Link'] || data.calendlyLink;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #111827; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4F46E5; color: #fff; padding: 16px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #F9FAFB; padding: 24px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #4F46E5; color: #FFFFFF !important; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; border: none; cursor: pointer; }
    .button:link { color: #FFFFFF !important; text-decoration: none; }
    .button:visited { color: #FFFFFF !important; text-decoration: none; }
    .button:hover { color: #FFFFFF !important; text-decoration: none; background: #3730A3; }
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
      <p><a class="button" href="${calendlyLink}" style="display: inline-block; background: #4F46E5; color: #FFFFFF !important; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Schedule Interview</a></p>
      <div class="footer">This is an automated message from Weekday.</div>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  buildPlainTextBody(data) {
    const company = data.Company || data.company;
    const candidate = data.Candidate || data.candidate;
    const interviewer = data.Interviewer || data.interviewer;
    const roundNumber = data['Round Number'] || data.roundNumber;
    const calendlyLink = data['Calendly Link'] || data.calendlyLink;

    return `
Dear ${candidate},

Congratulations! You have been shortlisted for an interview with ${company}.

Interview Details:
- Company: ${company}
- Interviewer: ${interviewer || 'TBA'}
- Round: ${roundNumber}

Schedule your interview:
${calendlyLink}

Best regards,
${interviewer || 'Interview Team'}
${company}

This is an automated message from Weekday.
    `.trim();
  }
}

module.exports = EmailService;
