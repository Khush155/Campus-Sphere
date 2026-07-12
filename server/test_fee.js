const mongoose = require('mongoose');
const User = require('./src/models/User.js');
const FeeStructure = require('./src/models/FeeStructure.js');
require('dotenv').config({ path: './.env' });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const student = await User.findById('6a53aedaa9fd154d3b2be2c7');
  
  const query = {
    $and: [
      { $or: [{ studentId: null }, { studentId: student._id }] },
      { $or: [{ courseId: null }, { courseId: student.courseId }] },
      { $or: [{ branchId: null }, { branchId: student.branchId }] },
      { $or: [{ semester: null }, { semester: student.semester }] }
    ]
  };

  const feeStructures = await FeeStructure.find(query);
  console.log('Returned feeStructures:', feeStructures.length);
  process.exit(0);
});
