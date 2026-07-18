const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  isbn: {
    type: String,
    unique: true,
    sparse: true
  },
  category: {
    type: String,
    required: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department' // Optional: if the book belongs to a specific department library
  },
  totalCopies: {
    type: Number,
    required: true,
    default: 1
  },
  availableCopies: {
    type: Number,
    required: true,
    default: 1
  },
  coverUrl: String,
  location: String // Shelf/Rack location
}, { timestamps: true });

bookSchema.index({ title: 'text', author: 'text' });
bookSchema.index({ category: 1 });

module.exports = mongoose.model('Book', bookSchema);
