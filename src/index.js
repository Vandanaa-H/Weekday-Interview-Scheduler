require('dotenv').config();

const logger = require('./utils/logger');
const AirtableService = require('./services/airtableService');
const EmailService = require('./services/emailService');
const { parseCsvFile, splitCandidateRow } = require('./parsers/csvParser');

const BATCH_SIZE = Number(process.env.EMAIL_BATCH_SIZE || 50);
const DELAY_MS = Number(process.env.EMAIL_DELAY_MS || 1000);
const CSV_INPUT_PATH = process.env.CSV_INPUT_PATH || './data/candidates.csv';

async function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function main() {
  logger.info('Weekday Interview Scheduler started');

  // 1) Parse CSV
  logger.info(`Parsing CSV: ${CSV_INPUT_PATH}`);
  const rawRows = parseCsvFile(CSV_INPUT_PATH);
  logger.info(`CSV rows: ${rawRows.length}`);

  // 2) Split rows per round
  const splitRows = rawRows.flatMap((row) => splitCandidateRow(row));
  logger.info(`Split into interview round rows: ${splitRows.length}`);

  const airtable = new AirtableService();
  const emailSvc = new EmailService();

  // 3) Upload to Airtable
  logger.info('Uploading to Airtable...');
  await airtable.createRecords(splitRows);
  logger.info('Upload complete');

  // 4) Fetch pending and send emails
  const pending = await airtable.getPendingEmails();
  logger.info(`Pending emails: ${pending.length}`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (record) => {
        const res = await emailSvc.sendInterviewInvitation(record.fields);
        if (res.success) {
          await airtable.updateEmailStatus(record.id, 'Sent', res.sentAt);
          logger.info(`Email sent to ${record.get('Candidate Email')}`);
          success++;
        } else {
          await airtable.updateEmailStatus(record.id, 'Failed', null, res.error);
          logger.error(`Failed: ${record.get('Candidate Email')} - Error: ${res.error}`);
          failed++;
        }
      })
    );

    if (i + BATCH_SIZE < pending.length) {
      await delay(DELAY_MS);
    }
  }

  // 5) Summary
  logger.info(`Finished. Success: ${success}, Failed: ${failed}`);
}

if (require.main === module) {
  main().catch((err) => {
    logger.error(`Fatal error: ${err && err.stack ? err.stack : err}`);
    process.exit(1);
  });
}

module.exports = { main };
