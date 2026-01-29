const fs = require('fs');
const { parse: parseCsvSync } = require('csv-parse/sync');
const { parse: parseDateFns, isValid } = require('date-fns');

/**
 * Parse "Scheduling method" into rounds:
 * Example: "Round1: https://... Round2: https://..."
 */
function parseSchedulingMethod(schedulingStr = '') {
  const rounds = [];
  const regex = /Round(\d+):\s*(https?:\/\/[^\s]+)/gi;
  let match;
  while ((match = regex.exec(schedulingStr)) !== null) {
    rounds.push({
      roundNumber: parseInt(match[1], 10),
      calendlyLink: match[2].trim()
    });
  }
  return rounds;
}

/**
 * Parse "04 Nov 1:18" into ISO string. Intelligently handles year.
 * If parsed date is in the future, assumes it was from last year.
 */
function parseDate(dateStr = '') {
  const trimmed = String(dateStr).trim();
  if (!trimmed) return null;

  const now = new Date();
  const currentYear = now.getFullYear();

  // Try parsing with current year first
  // e.g., "04 Nov 1:18" -> "04 Nov 1:18 2026"
  const withCurrentYear = `${trimmed} ${currentYear}`;
  let parsed = parseDateFns(withCurrentYear, 'dd MMM H:mm yyyy', new Date());
  
  if (isValid(parsed)) {
    // If parsed date is in the future, it's likely from last year
    if (parsed > now) {
      const withLastYear = `${trimmed} ${currentYear - 1}`;
      parsed = parseDateFns(withLastYear, 'dd MMM H:mm yyyy', new Date());
      if (isValid(parsed)) return parsed.toISOString();
    }
    return parsed.toISOString();
  }

  // Fallback: try without year (may default to current year)
  const fallback = parseDateFns(trimmed, 'dd MMM H:mm', new Date());
  return isValid(fallback) ? fallback.toISOString() : null;
}

/**
 * Split one candidate CSV row into N rows (one per round)
 */
function splitCandidateRow(row) {
  const rounds = parseSchedulingMethod(row['Scheduling method']);
  if (rounds.length === 0) {
    // If no rounds found, keep single row but mark as invalid
    return [
      {
        company: row.Company,
        interviewer: row.Interviewer,
        interviewerEmail: row['Interviewer Email'],
        candidate: row.Candidate,
        candidateEmail: row['Candidate Email'],
        roundNumber: 1,
        calendlyLink: null,
        addedOn: parseDate(row['Added On']),
        emailStatus: 'Pending',
        emailSentAt: null,
        tatHours: null,
        tatReadable: null
      }
    ];
  }

  return rounds.map((round) => ({
    company: row.Company,
    interviewer: row.Interviewer,
    interviewerEmail: row['Interviewer Email'],
    candidate: row.Candidate,
    candidateEmail: row['Candidate Email'],
    roundNumber: round.roundNumber,
    calendlyLink: round.calendlyLink,
    addedOn: parseDate(row['Added On']),
    emailStatus: 'Pending',
    emailSentAt: null,
    tatHours: null,
    tatReadable: null
  }));
}

/**
 * Read and parse CSV file into an array of objects
 */
function parseCsvFile(csvPath) {
  const buf = fs.readFileSync(csvPath);
  return parseCsvSync(buf, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
}

module.exports = {
  parseSchedulingMethod,
  parseDate,
  splitCandidateRow,
  parseCsvFile
};
