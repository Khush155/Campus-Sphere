const Book = require('../models/Book');
const LibraryTransaction = require('../models/LibraryTransaction');

// GET /api/v1/student/library
exports.getLibraryData = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    // 1. Fetch available books (Catalog)
    const books = await Book.find().sort({ createdAt: -1 }).limit(50); // Get latest 50 books for catalog

    // 2. Fetch my transactions
    const transactions = await LibraryTransaction.find({ studentId })
      .populate('bookId', 'title author coverUrl')
      .sort({ issueDate: -1 });

    res.status(200).json({
      success: true,
      data: {
        books,
        transactions
      }
    });
  } catch (error) {
    next(error);
  }
};
