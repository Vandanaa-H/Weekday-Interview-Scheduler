require('dotenv').config();

const apiKey = process.env.MAILERSEND_API_KEY;
const fromEmail = process.env.MAILERSEND_FROM_EMAIL;

console.log('Testing MailerSend API');
console.log('API Key (first 20 chars):', apiKey.substring(0, 20) + '...');
console.log('From Email:', fromEmail);
console.log('Domain:', fromEmail.split('@')[1]);
console.log('\n');

const payload = {
  from: {
    email: fromEmail,
    name: 'Weekday Interview Team'
  },
  to: [
    {
      email: 'test@example.com',
      name: 'Test User'
    }
  ],
  subject: 'Test Email',
  html: '<p>This is a test</p>',
  text: 'This is a test'
};

console.log('Payload:', JSON.stringify(payload, null, 2));
console.log('\nSending request to https://api.mailersend.com/v1/email');

fetch('https://api.mailersend.com/v1/email', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
})
.then(r => r.json())
.then(data => {
  console.log('\nResponse Status: ', data.message || 'Success');
  console.log('Full Response:', JSON.stringify(data, null, 2));
})
.catch(err => {
  console.error('Error:', err);
});
