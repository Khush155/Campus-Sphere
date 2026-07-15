const User = require('../models/User');
const Department = require('../models/Department');
const Subject = require('../models/Subject');
const PromotionBatch = require('../models/PromotionBatch');
const AuditLog = require('../models/AuditLog');
const { drawLetterhead } = require('../utils/pdfBranding');
const PDFDocument = require('pdfkit');

/**
 * Helper to build a comma-separated values (CSV) string.
 * Escapes commas, quotes, and newlines correctly.
 */
const generateCSVText = (headers, rows) => {
  const escapeCSV = (val) => {
    if (val === null || val === undefined) {return '';}
    let str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      str = '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  const headerLine = headers.join(',');
  const rowLines = rows.map((row) =>
    headers.map((h) => escapeCSV(row[h])).join(',')
  );
  return [headerLine, ...rowLines].join('\n');
};

/**
 * Helper to draw a structured layout data table in PDFKit.
 * Handles automatic zebra-striping, overflow paging, and text clipping boundaries.
 */
const drawPDFTable = (doc, headers, rows, title) => {
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#1c2e45').text(title, 50, 140);

  const startX = 50;
  let startY = 170;
  const tableWidth = doc.page.width - 100;
  const colWidth = tableWidth / headers.length;
  const rowHeight = 22;

  // Header background block
  doc.rect(startX, startY, tableWidth, rowHeight).fill('#1c2e45');

  // Header column texts
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff');
  headers.forEach((h, idx) => {
    doc.text(h, startX + idx * colWidth + 6, startY + 7, { width: colWidth - 12, ellipsis: true });
  });

  startY += rowHeight;

  // Row data rendering
  doc.fontSize(7).font('Helvetica').fillColor('#374151');
  rows.forEach((row, rIdx) => {
    // Check page boundaries overflow
    if (startY > doc.page.height - 80) {
      doc.addPage();
      // Draw headers again on new page for premium continuity
      startY = 50;
      doc.rect(startX, startY, tableWidth, rowHeight).fill('#1c2e45');
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff');
      headers.forEach((h, idx) => {
        doc.text(h, startX + idx * colWidth + 6, startY + 7, { width: colWidth - 12, ellipsis: true });
      });
      startY += rowHeight;
      doc.fontSize(7).font('Helvetica').fillColor('#374151');
    }

    // Zebra stripes shading
    if (rIdx % 2 === 1) {
      doc.rect(startX, startY, tableWidth, rowHeight).fill('#f9fafb');
    }

    doc.fillColor('#374151');
    headers.forEach((h, colIdx) => {
      const val = row[h] !== undefined && row[h] !== null ? String(row[h]) : '—';
      doc.text(val, startX + colIdx * colWidth + 6, startY + 7, { width: colWidth - 12, ellipsis: true });
    });

    // Separator line
    doc.moveTo(startX, startY + rowHeight)
      .lineTo(startX + tableWidth, startY + rowHeight)
      .strokeColor('#e5e7eb')
      .lineWidth(0.5)
      .stroke();

    startY += rowHeight;
  });
};

/**
 * Report Types Registry defining schemas and retrieval aggregates.
 * Allows simple additive registry inserts for subsequent modules.
 */
const REPORT_TYPES = {
  USER_ROSTER_SUMMARY: {
    label: 'User Roster Summary',
    description: 'Overview of active student, faculty, and HOD counts.',
    filtersSchema: ['departmentId'],
    headers: ['Role', 'Active Count'],
    generate: async (filters) => {
      const query = { status: 'ACTIVE' };
      if (filters.departmentId) {
        query.departmentId = filters.departmentId;
      }

      const [studentCount, facultyCount, hodCount] = await Promise.all([
        User.countDocuments({ ...query, role: 'STUDENT' }),
        User.countDocuments({ ...query, role: 'FACULTY' }),
        User.countDocuments({ ...query, role: 'HOD' }),
      ]);

      return [
        { Role: 'STUDENT', 'Active Count': studentCount },
        { Role: 'FACULTY', 'Active Count': facultyCount },
        { Role: 'HOD', 'Active Count': hodCount },
      ];
    },
  },
  DEPARTMENT_PERFORMANCE: {
    label: 'Department Overview',
    description: 'Consolidated report on department structures and staffing coverage.',
    filtersSchema: [],
    headers: ['Department Name', 'Active Students', 'Active Faculty', 'HOD Coverage', 'Subjects'],
    generate: async () => {
      const departments = await Department.find().sort({ name: 1 });
      const results = await Promise.all(
        departments.map(async (dept) => {
          const students = await User.countDocuments({
            departmentId: dept._id,
            role: 'STUDENT',
            status: 'ACTIVE',
          });
          const faculty = await User.countDocuments({
            departmentId: dept._id,
            role: 'FACULTY',
            status: 'ACTIVE',
          });
          const hods = await User.countDocuments({
            departmentId: dept._id,
            role: 'HOD',
            status: 'ACTIVE',
          });
          const subjects = await Subject.countDocuments({ departmentId: dept._id });

          return {
            'Department Name': dept.name,
            'Active Students': students,
            'Active Faculty': faculty,
            'HOD Coverage': hods > 0 ? 'Yes' : 'No',
            Subjects: subjects,
          };
        })
      );
      return results;
    },
  },
  PROMOTION_HISTORY: {
    label: 'Promotion Batch History',
    description: 'Log of promotion batch executions, including promotions and graduations.',
    filtersSchema: [],
    headers: ['Execution Date', 'Promoted Count', 'Graduated Count', 'Scope Filters', 'Status'],
    generate: async () => {
      const batches = await PromotionBatch.find().sort({ createdAt: -1 }).limit(50);
      return batches.map((b) => ({
        'Execution Date': new Date(b.createdAt).toLocaleDateString(),
        'Promoted Count': b.promotedCount,
        'Graduated Count': b.graduatedCount,
        'Scope Filters': b.scope ? JSON.stringify(b.scope) : '{}',
        Status: b.status,
      }));
    },
  },
  AUDIT_LOG_EXPORT: {
    label: 'Audit Log Export',
    description: 'Export of system operations and diff records.',
    filtersSchema: ['dateFrom', 'dateTo'],
    headers: ['Timestamp', 'Actor Name', 'Actor Role', 'Action', 'Target Model', 'Target ID'],
    generate: async (filters) => {
      const query = {};
      if (filters.dateFrom || filters.dateTo) {
        query.timestamp = {};
        if (filters.dateFrom) {
          query.timestamp.$gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
          const endOfDay = new Date(filters.dateTo);
          endOfDay.setHours(23, 59, 59, 999);
          query.timestamp.$lte = endOfDay;
        }
      }

      const logs = await AuditLog.find(query)
        .populate('actorId', 'name role')
        .sort({ timestamp: -1 })
        .limit(200);

      return logs.map((l) => ({
        Timestamp: new Date(l.timestamp).toLocaleString(),
        'Actor Name': l.actorId ? l.actorId.name : 'System',
        'Actor Role': l.actorId ? l.actorId.role : '—',
        Action: l.action,
        'Target Model': l.targetModel || '—',
        'Target ID': l.targetId ? String(l.targetId) : '—',
      }));
    },
  },
};

/**
 * Builds and streams report output in CSV or PDF formats.
 */
const exportReport = async ({ type, format, filters }, res) => {
  const handler = REPORT_TYPES[type];
  if (!handler) {
    throw new Error('Invalid report type.');
  }

  const data = await handler.generate(filters || {});

  if (format === 'CSV') {
    const csvContent = generateCSVText(handler.headers, data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="report_${type.toLowerCase()}_${Date.now()}.csv"`
    );
    return res.send(csvContent);
  } else if (format === 'PDF') {
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="report_${type.toLowerCase()}_${Date.now()}.pdf"`
    );
    doc.pipe(res);

    // Dynamic institutional header
    await drawLetterhead(doc);

    // Formatted data grid
    drawPDFTable(doc, handler.headers, data, handler.label);

    doc.end();
  } else {
    throw new Error('Unsupported format format.');
  }
};

module.exports = {
  REPORT_TYPES,
  exportReport,
};
