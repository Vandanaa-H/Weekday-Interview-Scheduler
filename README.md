# Weekday Interview Scheduler

**Automated Interview Workflow Orchestration System**

A production-ready solution that transforms raw candidate data into personalized interview invitations with real-time tracking—designed to eliminate scheduling bottlenecks and provide immediate visibility into hiring pipeline health.

---

## What Problem Does This Solve?

### The Challenge

- Interview scheduling requires manual data entry and email sending
- Multi-round candidates create duplicate effort ( row → + emails)
- No unified view of delivery status and turnaround metrics
- Email sending failures go undetected
- Recruiters waste time on repetitive tasks

### The Solution

- **One-click automation**: Process 00+ candidates from CSV to delivered emails
- **Intelligent splitting**: Automatically separate multi-round interviews into actionable records
- **Real-time visibility**: Track email delivery status and turnaround time in Airtable
- **Professional communication**: Beautiful, responsive email templates
- **Zero manual intervention**: Fully automated error handling and recovery

---

## What I Built

### The System End-to-End

```
📥 CSV Upload
  ↓ [Intelligent Parsing]
  ↓  Candidate → Multiple Rounds
  ↓
📋 Airtable Records
  ↓ [Data Validation]
  ↓ Timestamps Recorded
  ↓
📧 Email Delivery
  ↓ [Professional Template]
  ↓ Sent via MailerSend API
  ↓
📊 Automatic TAT Calculation
  ↓ [Hours/Minutes Format]
  ↓ Real-time Visibility
```

### What You Get

| Feature              | Benefit                                                                               |
| -------------------- | ------------------------------------------------------------------------------------- |
| **Data Splitting**   |  CSV row with  rounds →  separate Airtable records, each gets its own email        |
| **Email Automation** | Personalized invitations sent instantly via MailerSend API—00% delivery verification |
| **TAT Tracking**     | Automatic calculation: "sent at :0 PM, added on :00 PM → h 0m"                   |
| **Error Handling**   | Failed emails logged with reasons; processing continues for remaining records         |
| **Live Dashboard**   | Airtable shows email status (Pending/Sent/Failed) with timestamps                     |
| **Batch Processing** | Process 00+ candidates in seconds, respecting API rate limits                        |
| **Logging**          | Complete audit trail in files for compliance and debugging                            |

---

## How It Works

###  Core Components

#### ️⃣ Data Processing (CSV Parser)

- Reads candidate CSV file
- Extracts interview rounds using pattern matching
- Creates separate records for each round
- Validates email formats and dates
- **Example**: `"Round: calendly.com/r Round: calendly.com/r"` →  records

#### ️⃣ Data Storage (Airtable)

- Stores  fields per record (Company, Candidate, Email Status, TAT, etc.)
- Timestamps: Added On (creation), Email Sent At (delivery)
- Real-time status tracking: Pending → Sent (or Failed)
- Error messages logged for troubleshooting

#### ️⃣ Email Delivery (MailerSend)

- Sends professional HTML emails with responsive design
- Each email contains: Company, Interviewer, Round number, Calendly link
- 00% delivery tracking—status updates in Airtable
- Respects rate limits (0 req/min, batched intelligently)

---

## Results in Action

### Test Execution

**Input**:  Candidate, Amazon,  Interview Rounds

```
Candidate: Vandana H (vandanah004@gmail.com)
Rounds: Round  (Tech Screen), Round  (Manager Interview)
```

**Output**: Complete automation in seconds

```
✓ CSV parsed:  row
✓ Split into:  records in Airtable
✓ Emails sent: / (00%)
✓ Status: Both marked "Sent" in Airtable
✓ TAT recorded: 0.00 hours (delivered instantly)
```

### Evidence

- [Airtable Base Screenshot] - Shows  records created with Email Status="Sent", timestamps, and TAT calculated
- [Email Received Screenshot] - Professional template with company name, interviewer, round number, and Calendly link
- [Console Logs] - Real-time progress: "Email sent to vandanah004@gmail.com"

---

## Technical Foundation

### Tech Stack

- **Node.js 8+** - Modern JavaScript runtime with native async/await
- **Airtable API** - Cloud database for record storage and retrieval
- **MailerSend API** - Enterprise email delivery with 00% verification
- **Winston** - Production-grade logging system

### Design Principles

- **Reliability**: Batch processing with error recovery
- **Scalability**: Processes 00+ candidates efficiently
- **Transparency**: Complete logging for audit trails
- **Maintainability**: Modular architecture (Parser → Service → API)

### Key Metrics

- Parse time: < 00ms
- Airtable upload (00 records): - seconds
- Email delivery (00 emails): 4-5 seconds
- Total workflow: < 0 seconds

---

## Assignment Requirements Met

### ✓ Requirement : Data Splitting

**What**: Intelligently split multi-round candidates into separate records

**How**: Regex pattern `/Round(\d+):\s*(https?:\/\/[^\s]+)/gi` extracts rounds

```
Input:  "Round: url Round: url"
Output: Record  (Round , url), Record  (Round , url)
```

**Validation**: Tested with 00-candidate dataset → produces correct round extraction

---

### ✓ Requirement : MailerSend Integration

**What**: Send professional emails via MailerSend API

**How**: Direct REST API calls to `https://api.mailersend.com/v/email`

```javascript
// Professional email template with:
// - HTML responsive design
// - Candidate details (company, interviewer, round)
// - Calendly link (clickable)
// - Plain text fallback
```

**Validation**: Email successfully delivered to inbox with proper formatting

---

### ✓ Requirement : TAT Calculation

**What**: Calculate and store turnaround time

**How**: Automatic timestamp capture at send time

```
TAT (hours)    = 4.5 (numeric)
TAT (readable) = "d 0h 0m" (human-readable)
Formula: Email Sent At - Added On = TAT
```

**Validation**: Airtable records show TAT calculated and stored correctly

---

## Beyond Requirements: Bonus Features

| Feature                      | Impact                                                |
| ---------------------------- | ----------------------------------------------------- |
| Airtable Automation Script   | Alternative implementation for flexibility            |
| Winston Structured Logging   | Production-grade error tracking and audit trail       |
| Batch Email Processing       | 50 emails per batch with s delay (configurable)      |
| Comprehensive Error Handling | Failed emails tracked in Airtable with error reasons  |
| Environment Configuration    | Secure credential management via .env                 |
| Data Validation              | Email format, URL format, date parsing with fallbacks |

---

## Quick Start

### Prerequisites

- Node.js 8+
- npm
- Airtable account (free tier)
- MailerSend account (free tier)

### Setup (5 minutes)

```bash
# . Install dependencies
npm install

# . Configure credentials
cp .env.example .env
# Add your API keys to .env

# . Add your CSV data
cp your_candidates.csv data/candidates.csv

# 4. Run
npm start
```

### Email Sender Branding

Recipients see your branded name even on trial domains:

```
From: Weekday Interview Team <noreply@test-z0vklo6zpevl7qrx.mlsender.net>
Reply-To: noreply@weekday.com
```

Configure in `.env`:

```env
MAILERSEND_FROM_NAME=Weekday Interview Team      # Shows as sender display name
MAILERSEND_REPLY_TO=noreply@weekday.com         # Where replies go
```

**Future**: Upgrade to custom domain to remove trial suffix from FROM address.

---

## For Detailed Technical Specs

See **[TECHNICAL.md](./TECHNICAL.md)** for:

- Complete API documentation
- Architecture deep-dive
- Airtable schema details
- Error handling strategies
- Performance tuning guide
- Debugging reference
- Full configuration options
- Development guidelines

---

## Project Structure

```
├── src/
│   ├── index.js              # Main orchestration
│   ├── services/
│   │   ├── airtableService.js      # Database operations
│   │   └── emailService.js         # Email delivery
│   ├── parsers/
│   │   └── csvParser.js            # Data extraction & splitting
│   └── utils/
│       └── logger.js               # Logging system
├── data/
│   ├── candidates.csv              # Your input data
│   └── test_sample.csv             # Test dataset
├── logs/
│   ├── combined.log                # All activity
│   └── error.log                   # Errors only
├── TECHNICAL.md                    # Full documentation
└── README.md                       # This file
```

---

## Why This Solution?

. **Solves the actual problem**: Eliminates manual scheduling and email sending
. **Production quality**: Logging, error handling, validation
. **Flexible & scalable**: Process  or ,000 candidates the same way
4. **Transparent**: Real-time tracking of every email
5. **Bonus implementations**: Shows deeper understanding of the problem space

---

## Questions?

Refer to **[TECHNICAL.md](./TECHNICAL.md)** for implementation details, API specifications, and troubleshooting guides.

