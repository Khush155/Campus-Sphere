const Exam = require('../models/Exam');
const ExamResult = require('../models/ExamResult');
const Subject = require('../models/Subject');
const User = require('../models/User');
const { assertFacultyAssigned } = require('../utils/privilegeGuard');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const ROLES = require('../constants/roles');
const { logAuditEvent } = require('../utils/auditLogger');

const scheduleExam = async (examData, actor, req) => {
  const { name, subjectId, examType, date, maxMarks, passingMarks } = examData;

  const subject = await Subject.findById(subjectId);
  if (!subject) {
    throw new AppError('The specified subject does not exist', 404, ERROR_CODES.NOT_FOUND);
  }

  // Enforce Faculty workload boundary
  await assertFacultyAssigned(actor, subjectId);

  const newExam = await Exam.create({
    name,
    subjectId,
    examType,
    date,
    maxMarks,
    passingMarks,
  });

  // Audit Log
  await logAuditEvent({
    actorId: actor.id,
    action: 'EXAM_SCHEDULED',
    targetId: newExam._id,
    targetModel: 'Exam',
    after: newExam.toObject(),
    req
  });

  return newExam;
};

const submitExamResult = async (resultData, actor, req) => {
  const { examId, studentId, marksObtained, absent, remarks, isPublished } = resultData;

  let exam = await Exam.findById(examId);
  if (!exam) {
    const Assignment = require('../models/Assignment');
    const asg = await Assignment.findById(examId);
    if (asg) {
      exam = await Exam.findOne({ name: asg.title, subjectId: asg.subjectId });
      if (!exam) {
        exam = await Exam.create({
          name: asg.title,
          subjectId: asg.subjectId,
          examType: 'QUIZ',
          date: asg.dueDate || new Date(),
          maxMarks: asg.maxMarks || 100,
          passingMarks: Math.round((asg.maxMarks || 100) * 0.4),
        });
      }
    } else {
      throw new AppError('Exam schedule or assignment not found', 404, ERROR_CODES.NOT_FOUND);
    }
  }

  // Use resolved exam._id
  const targetExamId = exam._id;

  // Enforce Faculty workload boundary
  await assertFacultyAssigned(actor, exam.subjectId);

  const student = await User.findById(studentId);
  if (!student) {
    throw new AppError('Student account not found', 404, ERROR_CODES.NOT_FOUND);
  }

  let resultRecord = await ExamResult.findOne({ examId: targetExamId, studentId });
  const before = resultRecord ? resultRecord.toObject() : null;

  if (resultRecord) {
    resultRecord.marksObtained = absent ? 0 : (marksObtained ?? 0);
    resultRecord.absent = absent ?? false;
    resultRecord.remarks = remarks ?? '';
    if (isPublished !== undefined) {
      resultRecord.isPublished = isPublished;
    }
  } else {
    resultRecord = new ExamResult({
      examId: targetExamId,
      studentId,
      marksObtained: absent ? 0 : (marksObtained ?? 0),
      absent: absent ?? false,
      remarks: remarks ?? '',
      isPublished: isPublished ?? false,
    });
  }

  await resultRecord.save();
  await resultRecord.populate([
    { path: 'studentId', select: 'name email' },
    { path: 'examId', select: 'name examType maxMarks' }
  ]);

  // Audit Log
  await logAuditEvent({
    actorId: actor.id,
    action: 'EXAM_RESULT_SUBMITTED',
    targetId: resultRecord._id,
    targetModel: 'ExamResult',
    before,
    after: resultRecord.toObject(),
    req
  });

  return resultRecord;
};

const calculateStudentGPA = async (studentId) => {
  const student = await User.findById(studentId);
  if (!student) {
    throw new AppError('Student not found', 404, ERROR_CODES.NOT_FOUND);
  }

  const publishedResults = await ExamResult.find({
    studentId,
    isPublished: true,
  }).populate({
    path: 'examId',
    populate: { path: 'subjectId' },
  });

  if (publishedResults.length === 0) {
    return {
      student: { name: student.name, email: student.email },
      gpa: 0,
      totalCredits: 0,
      message: 'GPA is 0 because there are no published exam results yet.',
    };
  }

  let totalCredits = 0;
  let weightedPointsSum = 0;
  const gradeBreakdown = [];

  for (const result of publishedResults) {
    const exam = result.examId;
    if (!exam) {
      continue;
    }

    const subject = exam.subjectId;
    if (!subject) {
      continue;
    }

    const credits = subject.credits;
    const gradePoint = result.gradePoint;

    weightedPointsSum += (gradePoint * credits);
    totalCredits += credits;

    gradeBreakdown.push({
      subjectName: subject.name,
      subjectCode: subject.code,
      credits,
      grade: result.grade,
      gradePoint,
    });
  }

  const gpa = totalCredits > 0 ? (weightedPointsSum / totalCredits) : 0;
  const roundedGPA = Math.round(gpa * 100) / 100;

  return {
    student: {
      id: student._id,
      name: student.name,
      email: student.email,
    },
    gpa: roundedGPA,
    totalCredits,
    gradeBreakdown,
  };
};

const getExams = async (queryOptions, actor) => {
  const { subjectId } = queryOptions;
  const filters = {};

  if (subjectId) {
    filters.subjectId = subjectId;
  }

  // Enforce department boundaries
  const userDeptId = actor.departmentId?._id || actor.departmentId;
  if (userDeptId && (actor.role === ROLES.HOD || actor.role === ROLES.FACULTY || actor.role === ROLES.STUDENT)) {
    const deptsSubject = await Subject.find({ departmentId: userDeptId }).select('_id');
    const subjectIds = deptsSubject.map(s => s._id);
    filters.subjectId = { $in: subjectIds };
    if (subjectId && subjectIds.some(id => id.toString() === subjectId.toString())) {
      filters.subjectId = subjectId;
    }
  }

  let exams = await Exam.find(filters).populate('subjectId', 'name code').sort({ date: 1 });

  // Auto-seed standard Mid-Term and End-Term exams if none exist for this subject
  if (subjectId && exams.length === 0) {
    const subject = await Subject.findById(subjectId);
    if (subject) {
      const defaultExams = [
        { name: 'Mid-Term Examination', subjectId, examType: 'MID_TERM', date: new Date(), maxMarks: 50, passingMarks: 20 },
        { name: 'End-Term Examination', subjectId, examType: 'END_TERM', date: new Date(), maxMarks: 100, passingMarks: 40 },
        { name: 'Class Quiz 1', subjectId, examType: 'QUIZ', date: new Date(), maxMarks: 20, passingMarks: 8 },
        { name: 'Practical Exam / Lab Test', subjectId, examType: 'LAB', date: new Date(), maxMarks: 50, passingMarks: 20 },
      ];
      await Exam.insertMany(defaultExams);
      exams = await Exam.find(filters).populate('subjectId', 'name code').sort({ date: 1 });
    }
  }

  return exams;
};

const getExamResults = async (examId, _actor) => {
  let exam = await Exam.findById(examId).populate('subjectId');
  
  if (!exam) {
    const Assignment = require('../models/Assignment');
    const asg = await Assignment.findById(examId);
    if (asg) {
      exam = await Exam.findOne({ name: asg.title, subjectId: asg.subjectId }).populate('subjectId');
    }
  }

  if (!exam) {
    return [];
  }

  const results = await ExamResult.find({ examId: exam._id }).populate('studentId', 'name email');
  return results;
};

module.exports = {
  scheduleExam,
  submitExamResult,
  calculateStudentGPA,
  getExams,
  getExamResults,
};
