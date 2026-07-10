const mongoose = require('mongoose');
const User = require('../models/User');
const Subject = require('../models/Subject');
const FacultyAssignment = require('../models/FacultyAssignment');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');

const getHodMetrics = async (departmentId) => {
  if (!departmentId) {
    throw new AppError('Department ID is required', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const deptObjectId = new mongoose.Types.ObjectId(departmentId);

  // 1. Workload Distribution
  // Get all active faculty in the department and count their active assignments
  const workloadDistribution = await User.aggregate([
    { 
      $match: { 
        departmentId: deptObjectId, 
        role: 'FACULTY', 
        status: 'ACTIVE' 
      } 
    },
    { 
      $lookup: { 
        from: 'facultyassignments', 
        localField: '_id', 
        foreignField: 'facultyId', 
        as: 'assignments' 
      } 
    },
    { 
      $project: { 
        name: 1, 
        email: 1,
        subjectCount: { 
          $size: { 
            $filter: { 
              input: '$assignments', 
              as: 'assignment', 
              cond: { $eq: ['$$assignment.status', 'ACTIVE'] } 
            } 
          } 
        } 
      } 
    },
    {
      $sort: { subjectCount: -1, name: 1 }
    }
  ]);

  // 2. Vacant Subjects
  // Find all subjects in the department, and lookup active assignments for them
  // If a subject has 0 active assignments, it is vacant.
  const subjectsWithAssignments = await Subject.aggregate([
    {
      $match: {
        departmentId: deptObjectId
      }
    },
    {
      $lookup: {
        from: 'facultyassignments',
        let: { subject_id: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$subjectId', '$$subject_id'] },
                  { $eq: ['$status', 'ACTIVE'] }
                ]
              }
            }
          }
        ],
        as: 'activeAssignments'
      }
    },
    {
      $match: {
        activeAssignments: { $size: 0 }
      }
    },
    {
      $lookup: {
        from: 'branches',
        localField: 'branchId',
        foreignField: '_id',
        as: 'branchInfo'
      }
    },
    {
      $unwind: { path: '$branchInfo', preserveNullAndEmptyArrays: true }
    },
    {
      $project: {
        name: 1,
        code: 1,
        credits: 1,
        semester: 1,
        branchName: '$branchInfo.name',
        branchCode: '$branchInfo.code'
      }
    },
    {
      $sort: { semester: 1, name: 1 }
    }
  ]);

  return {
    workloadDistribution,
    vacantSubjects: subjectsWithAssignments,
  };
};

module.exports = {
  getHodMetrics,
};
