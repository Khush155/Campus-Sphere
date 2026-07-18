const path = require('path');
const fs = require('fs');
const { getProfile } = require('../services/collegeProfileService');

/**
 * Shared utility to draw letterhead branding on a PDF document dynamically.
 * Automatically adapts layout size based on current page width (ID Card vs Certificate).
 */
const drawLetterhead = async (doc) => {
  let profile = { name: 'CampusSphere ERP', affiliation: '', address: '' };
  try {
    const fetched = await getProfile();
    if (fetched) {
      profile = fetched;
    }
  } catch (err) {
    // Fallback gracefully on profile retrieval errors
  }

  const isMini = doc.page.width < 300;

  if (isMini) {
    // ─── Compact Header for ID Cards ───
    if (profile.logoUrl) {
      // profile.logoUrl is like "/uploads/college/logo-xxx.jpg" or "uploads/college/logo-xxx.jpg"
      const relativeLogoPath = profile.logoUrl.replace(/^\/?uploads\/?/, '');
      const logoPath = path.join(__dirname, '..', 'uploads', relativeLogoPath);
      if (fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, 10, 8, { width: 22 });
        } catch (e) {
          // ignore corrupted image file issues
        }
      }
    }
    const textStartX = profile.logoUrl ? 38 : 10;
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#1c2e45').text(profile.name, textStartX, 10, { lineBreak: false });
    if (profile.affiliation) {
      doc.fontSize(5).font('Helvetica').fillColor('#6b7280').text(profile.affiliation.substring(0, 45), textStartX, 20, { lineBreak: false });
    }
    doc.moveTo(10, 32).lineTo(doc.page.width - 10, 32).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
  } else {
    // ─── Standard Letterhead for Certificates ───
    if (profile.logoUrl) {
      const relativeLogoPath = profile.logoUrl.replace(/^\/?uploads\/?/, '');
      const logoPath = path.join(__dirname, '..', 'uploads', relativeLogoPath);
      if (fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, 50, 40, { width: 55 });
        } catch (e) {
          // ignore image decoding exceptions
        }
      }
    }
    const textStartX = profile.logoUrl ? 120 : 50;
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#1c2e45').text(profile.name, textStartX, 45);
    if (profile.affiliation) {
      doc.fontSize(9).font('Helvetica').fillColor('#4b5563').text(profile.affiliation, textStartX, 68);
    }
    if (profile.address) {
      doc.fontSize(8).font('Helvetica').fillColor('#6b7280').text(profile.address, textStartX, 80);
    }
    doc.moveTo(50, 110).lineTo(doc.page.width - 50, 110).strokeColor('#b8863e').lineWidth(1.5).stroke();
  }

  // Restore defaults for downstream operations
  doc.fillColor('#1c2e45').strokeColor('#1c2e45').lineWidth(1);
  return doc;
};

module.exports = { drawLetterhead };
