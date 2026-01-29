const Airtable = require('airtable');

class AirtableService {
  constructor() {
    this.base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
      process.env.AIRTABLE_BASE_ID
    );
    this.table = this.base(process.env.AIRTABLE_TABLE_NAME);
  }

  async createRecords(records) {
    const chunks = this.chunkArray(records, 10);
    const created = [];
    for (const chunk of chunks) {
      const res = await this.table.create(chunk.map((r) => ({ fields: this.mapToFields(r) })));
      created.push(...res);
    }
    return created;
  }

  async getPendingEmails() {
    return await this.table
      .select({
        filterByFormula: "{Email Status} = 'Pending'",
        maxRecords: 1000
      })
      .all();
  }

  async updateEmailStatus(recordId, status, sentAtIso = null, errorMsg = null) {
    // fetch record to compute TAT correctly
    const record = await this.table.find(recordId);
    const addedOn = record.get('Added On'); // Airtable Date field returns JS Date or ISO depending on API
    let fields = { 'Email Status': status };

    if (sentAtIso) {
      const sentAt = new Date(sentAtIso);
      fields['Email Sent At'] = sentAt.toISOString();

      const added = addedOn ? new Date(addedOn) : null;
      if (added && Number.isFinite(added.getTime())) {
        const diffMs = sentAt.getTime() - added.getTime();
        const hours = Math.round((diffMs / 36e5) * 100) / 100;
        fields['TAT (hours)'] = hours;
        fields['TAT (readable)'] = this.msToReadable(diffMs);
      }
    }

    if (errorMsg) {
      fields['Error Message'] = String(errorMsg).slice(0, 500);
    }

    return await this.table.update(recordId, fields);
  }

  mapToFields(r) {
    return {
      Company: r.company,
      Interviewer: r.interviewer,
      'Interviewer Email': r.interviewerEmail,
      Candidate: r.candidate,
      'Candidate Email': r.candidateEmail,
      'Round Number': r.roundNumber,
      'Calendly Link': r.calendlyLink,
      'Added On': r.addedOn,
      'Email Status': r.emailStatus,
      'Email Sent At': r.emailSentAt,
      'TAT (hours)': r.tatHours,
      'TAT (readable)': r.tatReadable
    };
  }

  msToReadable(ms) {
    // Handle negative TAT (should not happen, but be defensive)
    if (ms < 0) {
      return 'Invalid (negative TAT)';
    }
    
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

  chunkArray(arr, size) {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }
}

module.exports = AirtableService;
