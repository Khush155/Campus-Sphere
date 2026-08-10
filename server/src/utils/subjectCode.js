/**
 * Computes the display code for a subject.
 * `admissionYear` is optional — when provided, returns the full batch-specific code.
 * When omitted, returns the year-agnostic curriculum code.
 *
 * @param {Object} subject - Subject object containing semester & sequenceNo
 * @param {Object} branch - Branch object containing code (e.g., { code: 'CAI' })
 * @param {Number|String|null} admissionYear - e.g., 2024 or "2024" or null
 * @returns {String} e.g. "24CAI0306" or "CAI0306"
 */
const computeSubjectCode = (subject, branch, admissionYear = null) => {
  if (!subject) {
    return '';
  }
  const branchCode = (branch?.code || branch?.name || 'SUB')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase();
  const semPart = String(subject.semester || 1).padStart(2, '0');
  const seqPart = String(subject.sequenceNo || 1).padStart(2, '0');
  const base = `${branchCode}${semPart}${seqPart}`;

  if (admissionYear) {
    const yearPart = String(admissionYear).slice(-2); // "2024" -> "24"
    return `${yearPart}${base}`;
  }
  return base; // e.g. "CAI0306"
};

module.exports = { computeSubjectCode };
