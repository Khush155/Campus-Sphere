/* eslint-disable no-console */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Department = require('../models/Department');
const Subject = require('../models/Subject');
const LeaveRequest = require('../models/LeaveRequest');
const DocumentRequest = require('../models/DocumentRequest');
const Complaint = require('../models/Complaint');
const FacultyAssignment = require('../models/FacultyAssignment');
const ROLES = require('../constants/roles');

const seedHodData = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGODB_URI is not defined.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to DB');

    // 1. Get references
    const dept = await Department.findOne();
    if (!dept) {throw new Error('No departments found. Run normal seed first.');}

    const faculty = await User.findOne({ role: ROLES.FACULTY, departmentId: dept._id });
    const student = await User.findOne({ role: ROLES.STUDENT, departmentId: dept._id });
    const hod = await User.findOne({ role: ROLES.HOD, departmentId: dept._id });
    const subject = await Subject.findOne({ departmentId: dept._id });

    if (!faculty || !student || !subject) {
      console.log('Creating dummy faculty and student for the department...');
      if (!faculty) {
        await User.create({ name: 'Dummy Faculty', email: 'faculty.dummy@test.edu', password: 'password', role: ROLES.FACULTY, departmentId: dept._id, isActive: true });
      }
      if (!student) {
        await User.create({ name: 'Dummy Student', email: 'student.dummy@test.edu', password: 'password', role: ROLES.STUDENT, departmentId: dept._id, isActive: true });
      }
      if (!subject) {
        await Subject.create({ name: 'Dummy Subject', code: 'DUM101', credits: 3, departmentId: dept._id, isActive: true });
      }
    }

    const fac = await User.findOne({ role: ROLES.FACULTY, departmentId: dept._id });
    const stu = await User.findOne({ role: ROLES.STUDENT, departmentId: dept._id });
    const sub = await Subject.findOne({ departmentId: dept._id });
    const currentHod = hod || fac;

    console.log('Seeding Leaves...');
    await LeaveRequest.deleteMany({});
    await LeaveRequest.create([
      { userId: fac._id, departmentId: dept._id, leaveType: 'SICK', startDate: new Date(), endDate: new Date(), reason: 'Fever', status: 'PENDING' },
      { userId: stu._id, departmentId: dept._id, leaveType: 'CASUAL', startDate: new Date(), endDate: new Date(), reason: 'Family event', status: 'APPROVED' },
    ]);

    console.log('Seeding Documents...');
    await DocumentRequest.deleteMany({});
    await DocumentRequest.create([
      { studentId: stu._id, departmentId: dept._id, documentType: 'BONAFIDE', purpose: 'Bank Loan', status: 'PENDING' },
      { studentId: stu._id, departmentId: dept._id, documentType: 'LOR', purpose: 'Higher Studies', status: 'PENDING' },
    ]);

    console.log('Seeding Complaints...');
    await Complaint.deleteMany({});
    await Complaint.create([
      { title: 'Projector broken', description: 'Projector in room 101 not working', category: 'INFRASTRUCTURE', submittedBy: stu._id, departmentId: dept._id, status: 'OPEN' },
      { title: 'Syllabus delay', description: 'Subject DUM101 is lagging behind', category: 'ACADEMIC', submittedBy: stu._id, departmentId: dept._id, status: 'OPEN' },
    ]);

    console.log('Seeding Faculty Assignments...');
    try {
      await mongoose.connection.collection('facultyassignments').dropIndexes();
    } catch (err) {
      console.log('Could not drop old indexes, continuing...');
    }
    await FacultyAssignment.deleteMany({});
    await FacultyAssignment.create([
      { facultyId: fac._id, subjectId: sub._id, group: 'A1', status: 'ACTIVE', assignedBy: currentHod._id },
      { facultyId: fac._id, subjectId: sub._id, group: 'A2', status: 'ACTIVE', assignedBy: currentHod._id }
    ]);

    console.log('Seeding successful!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedHodData();
