const mongoose = require('mongoose');

const academicSessionSchema = new mongoose.Schema(
  {
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      trim: true,
    },
    semesterType: {
      type: String,
      enum: ['ODD', 'EVEN'],
      required: [true, 'Semester type is required'],
    },
    termStartDate: {
      type: Date,
      required: [true, 'Term start date is required'],
    },
    termEndDate: {
      type: Date,
      required: [true, 'Term end date is required'],
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index on year + semester type
academicSessionSchema.index({ academicYear: 1, semesterType: 1 }, { unique: true });

const AcademicSession = mongoose.model('AcademicSession', academicSessionSchema);

const dropOldIndex = async () => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return;
    }
    const collections = await db.listCollections({ name: 'academicsessions' }).toArray();
    if (collections.length > 0) {
      const collection = db.collection('academicsessions');
      const indexes = await collection.indexes();
      if (indexes.some((idx) => idx.name === 'academicYear_1')) {
        await collection.dropIndex('academicYear_1');
      }
    }
  } catch (err) {
    // Ignore if not initialized yet
  }
};

if (mongoose.connection.readyState === 1) {
  dropOldIndex();
} else {
  mongoose.connection.once('open', dropOldIndex);
}

module.exports = AcademicSession;
