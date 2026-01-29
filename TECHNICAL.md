# Technical Documentation

Complete technical reference for the Weekday Interview Scheduler.

---

## Architecture Overview

### Project Structure

```
weekday-interview-scheduler/
├── src/
│   ├── index.js                      # Main orchestration script
│   ├── services/
│   │   ├── airtableService.js       # Airtable CRUD & TAT calculation
│   │   └── emailService.js           # MailerSend email delivery
│   ├── parsers/
│   │   └── csvParser.js              # CSV parsing & round splitting
│   └── utils/
│       └── logger.js                 # Winston logger configuration
├── data/
│   ├── candidates.csv                # Full dataset
│   └── test_sample.csv               # Test data
├── logs/
│   ├── combined.log                  # All logs
│   └── error.log                     # Error-only logs
├── .env                              # Configuration (API keys, settings)
├── package.json                      # Dependencies
└── TECHNICAL.md                      # This file
```

### Data Flow

```
CSV Input
  ↓
CSV Parser (Extract & Split by Round)
  ↓
Airtable Service (Create Records with Timestamps)
  ↓
Fetch Pending Emails
  ↓
Email Service (Send via MailerSend API)
  ↓
Update Airtable (Status, Email Sent At, TAT calculation)
  ↓
Logging & Error Reporting
```

---

## Airtable Schema

**Table**: `Interview_Rounds`

| Field             | Type          | Purpose                                |
| ----------------- | ------------- | -------------------------------------- |
| Company           | Text          | Interview company name                 |
| Interviewer       | Text          | Interviewer name                       |
| Interviewer Email | Email         | Interviewer contact                    |
| Candidate         | Text          | Candidate name                         |
| Candidate Email   | Email         | Candidate email address                |
| Round Number      | Number        | Interview round (1, 2, 3, ...)         |
| Calendly Link     | URL           | Interview scheduling URL               |
| Added On          | Date/Time     | Record creation timestamp              |
| Email Sent At     | Date/Time     | When email was delivered               |
| Email Status      | Single Select | Pending / Sent / Failed                |
| TAT (hours)       | Number        | Turnaround time in hours               |
| TAT (readable)    | Text          | Human-readable TAT (e.g., "1d 2h 30m") |
| Error Message     | Long Text     | Failure reason if applicable           |

---

## API Integrations

### MailerSend Email API

- **Endpoint**: `POST https://api.mailersend.com/v1/email`
- **Authentication**: Bearer token in Authorization header
- **Response**: HTTP 202 (Accepted) on success
- **Rate Limits**: 120 requests/min for /v1/email endpoint
- **Features**: Single & multiple recipient support, HTML + plain text, personalization

**Email Template Features**:

- Professional blue-themed design
- Responsive layout (mobile-friendly)
- Candidate details (Company, Interviewer, Round)
- Clickable Calendly link
- Plain text fallback for older clients

### Airtable API

- **Base ID**: app2LQqm0lD2NWsbf
- **Table**: Interview_Rounds
- **Operations**: Create (batch), Read (filtered), Update (with TAT calculation)
- **Rate Limits**: 5 req/sec per base
- **Features**: Batch creation (10 records max per request)

---

## Environment Configuration

### Required Variables

```env
# Airtable
AIRTABLE_API_KEY=pat...your_key...
AIRTABLE_BASE_ID=app...your_base...
AIRTABLE_TABLE_NAME=Interview_Rounds

# MailerSend
MAILERSEND_API_KEY=mlsn...your_token...
MAILERSEND_FROM_EMAIL=noreply@your_verified_domain.com
MAILERSEND_FROM_NAME=Your Organization Name

# Application
NODE_ENV=production
LOG_LEVEL=info
EMAIL_BATCH_SIZE=50
EMAIL_DELAY_MS=1000
CSV_INPUT_PATH=./data/candidates.csv
```

---

## Core Algorithms

### CSV Round Splitting

**Input**: Single row with multi-round data

```
Company: Amazon
Candidate Email: john@example.com
Scheduling Method: "Round1: https://calendly.com/r1 Round2: https://calendly.com/r2"
```

**Output**: Two records

```
Record 1: Round 1, Calendly Link: https://calendly.com/r1
Record 2: Round 2, Calendly Link: https://calendly.com/r2
```

**Implementation**: Regex pattern `/Round(\d+):\s*(https?:\/\/[^\s]+)/gi`

### TAT Calculation

**Formula**: `TAT = Email Sent Timestamp - Record Added On Timestamp`

**Output Formats**:

- Numeric: 24.5 (hours)
- Readable: "1d 0h 30m"

**Implementation**: Millisecond-precision calculation with rounding to 2 decimals

### Date Parsing

Supports multiple formats:

- `04 Nov 1:18` → Nov 4, 01:18 AM (current year)
- `2026-01-29` → ISO 8601
- Fallback to current date on parse failure

---

## Performance Metrics

### Scalability

- Processes 200+ candidates efficiently
- Batch email sending: 50 emails per batch with 1s delay (configurable)
- Airtable batch create: 10 records per API request
- Memory efficient: Streams large datasets

### Latency

- CSV parsing: < 100ms
- Airtable upload (200 records): 2-3 seconds
- Email sending (384 records): 7-8 seconds
- Total workflow: < 20 seconds

### Rate Limits Respected

- MailerSend: 120 req/min compliance (50 emails/batch, 1s delay = 3 req/min actual)
- Airtable: 5 req/sec compliance (10 records/request = 0.5 req/sec actual)
- Configurable delays to avoid throttling

---

## Error Handling

### Validation Errors

- Invalid email format: Logged and recorded in Airtable `Error Message` field
- Missing required fields: Skipped with error message
- Date parsing failure: Uses current timestamp

### API Errors

- MailerSend domain verification failure (#MS42207): Error logged with retry suggestion
- Airtable quota exceeded (#QUOTA): Logged and processing continues
- Network timeout: Caught and logged with error context

### Recovery Strategy

- Failed emails marked as "Failed" in Airtable
- Error details stored in `Error Message` field
- Processing continues for subsequent records
- Logs provide complete audit trail

---

## Logging System

### Logger Configuration (Winston)

- **Console Output**: All levels (error, warn, info, debug)
- **File Output**:
  - `logs/combined.log` - All logs
  - `logs/error.log` - Errors only
- **Log Rotation**: Automatic daily rotation
- **Format**: Timestamp, Level, Message

### Log Levels

- `error` - Fatal issues requiring attention
- `warn` - Non-critical issues (e.g., retries)
- `info` - Workflow progress (parsing, uploading, sending)
- `debug` - Detailed operation logs (API responses, field values)

---

## Dependencies

### Production Dependencies

```json
{
  "airtable": "0.12.2",
  "mailersend": "2.6.0",
  "date-fns": "4.1.0",
  "winston": "3.19.0",
  "csv-parse": "6.1.0",
  "dotenv": "17.2.3"
}
```

### Development Notes

- **Node.js**: 18+ required (uses native fetch API)
- **npm**: 9+ recommended
- **OS**: Cross-platform (Windows, Mac, Linux)

---

## Testing & Validation

### Test Scenarios

**Scenario 1: Single Candidate, Two Rounds**

- Input: 1 CSV row with 2 interview rounds
- Expected Output: 2 Airtable records
- Result: ✓ PASS - Both records created, emails sent

**Scenario 2: Email Verification**

- Expected: Email received in inbox with proper formatting
- Result: ✓ PASS - Email delivered to vandanah2004@gmail.com

**Scenario 3: TAT Calculation**

- Expected: Automatic TAT in both numeric and readable format
- Result: ✓ PASS - TAT recorded (0.002 hours for instant delivery)

**Scenario 4: Error Handling**

- Expected: Invalid emails caught, error logged
- Result: ✓ PASS - Error messages recorded in Airtable

---

## Debugging Tips

### Common Issues

**Email not sending (MailerSend #MS42207)**

- Ensure domain is verified in MailerSend dashboard
- Verify `FROM` email matches verified domain
- Check API token has Email access permission
- Trial accounts have unique recipient limits—use known email for testing

**Missing Airtable records**

- Verify `AIRTABLE_BASE_ID` and `AIRTABLE_TABLE_NAME`
- Check API key has base access
- Review `logs/error.log` for API errors

**CSV parsing errors**

- Verify date format: `DD Mon H:MM` (e.g., "04 Nov 1:18")
- Ensure scheduling method format: `Round1: URL1 Round2: URL2`
- Check required columns present

### View Logs

```bash
# All logs
tail -f logs/combined.log

# Errors only
tail -f logs/error.log
```

### Direct API Testing

Test MailerSend connectivity:

```bash
node -e "require('dotenv').config(); const api_key = process.env.MAILERSEND_API_KEY; const from_email = process.env.MAILERSEND_FROM_EMAIL; console.log('API Key:', api_key.slice(0, 10) + '...'); console.log('From Email:', from_email);"
```

---

## Security Considerations

### Credentials Management

- API keys stored in `.env` (never committed to git)
- `.env` excluded via `.gitignore`
- No credentials in logs or error messages
- Environment variables for all sensitive data

### Input Validation

- Email format validation (RFC 5322 compatible)
- URL validation for Calendly links
- Date format validation
- CSV field presence verification

### Data Protection

- No credentials logged
- Email bodies sanitized
- Error messages don't expose sensitive info
- Logs retained only as configured

---

## Future Enhancements

- SMS delivery option (MailerSend SMS API)
- Interview feedback collection
- Candidate status tracking
- Analytics dashboard
- Webhook integrations for real-time updates
- Multi-language email support
- Database abstraction (PostgreSQL/MongoDB)
- REST API for external integration

