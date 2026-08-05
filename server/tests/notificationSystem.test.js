const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../src/models/User');
const Department = require('../src/models/Department');
const noticeService = require('../src/services/noticeService');
const leaveService = require('../src/services/leaveService');
const notificationService = require('../src/services/notificationService');

jest.setTimeout(120000);

describe('Notification System Integration Verification Tests', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
  });

  it('should run full notification lifecycle (publish, leave, mark read, ownership guard)', async () => {
    const dept = await Department.create({ name: 'Computer Science', code: 'CS', status: 'ACTIVE' });

    const admin = await User.create({
      name: 'System SuperAdmin',
      email: 'admin.notif@test.com',
      password: 'password123',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    });

    const hodMath = await User.create({
      name: 'Dr. Math HOD',
      email: 'hod.notif@test.com',
      password: 'password123',
      role: 'HOD',
      departmentId: dept._id,
      shift: 'GENERAL',
      status: 'ACTIVE',
    });

    const faculty = await User.create({
      name: 'Prof. Alan Turing',
      email: 'faculty.notif@test.com',
      password: 'password123',
      role: 'FACULTY',
      departmentId: dept._id,
      status: 'ACTIVE',
    });

    const student = await User.create({
      name: 'Ada Lovelace',
      email: 'student.notif@test.com',
      password: 'password123',
      role: 'STUDENT',
      departmentId: dept._id,
      rollNumber: 'NOTIF001',
      status: 'ACTIVE',
    });

    // 1. Notice Board Notification Dispatch
    await noticeService.createNotice(
      {
        title: 'VERIFICATION NOTICE: Campus Mid-Term Schedule',
        content: 'Official mid-term examination timetable has been published.',
        targetRoles: ['STUDENT'],
        status: 'PUBLISHED',
      },
      admin._id
    );

    const studentUnread = await notificationService.getUnreadCountForUser(student._id);
    expect(studentUnread).toBe(1);

    // 2. Faculty Leave Request & HOD Approval Notifications
    const leave = await leaveService.createLeaveRequest(
      {
        leaveType: 'CASUAL',
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000 * 2),
        reason: 'Verification test leave request',
      },
      { id: faculty._id, departmentId: faculty.departmentId, name: faculty.name }
    );

    const hodUnreadAfterSubmit = await notificationService.getUnreadCountForUser(hodMath._id);
    expect(hodUnreadAfterSubmit).toBe(1);

    // HOD approves leave
    await leaveService.updateLeaveStatus(
      leave._id,
      { status: 'APPROVED', remarks: 'Approved for verification test' },
      { id: hodMath._id, role: 'HOD', departmentId: faculty.departmentId }
    );

    const facultyUnread = await notificationService.getUnreadCountForUser(faculty._id);
    expect(facultyUnread).toBe(1);

    // 3. Strict Recipient Ownership Guarding
    const facultyNotifs = await notificationService.getNotificationsForUser(faculty._id, { page: 1, limit: 5 });
    const targetNotifId = facultyNotifs.notifications[0]._id;

    // Student attempts to mark Faculty's notification as read (should be blocked)
    const hackAttempt = await notificationService.markAsRead(targetNotifId, student._id);
    expect(hackAttempt).toBeNull();

    // Legitimate owner marks as read
    const validRead = await notificationService.markAsRead(targetNotifId, faculty._id);
    expect(validRead.isRead).toBe(true);

    // 4. Mark All As Read Action
    await notificationService.markAllAsRead(student._id);
    const studentUnreadFinal = await notificationService.getUnreadCountForUser(student._id);
    expect(studentUnreadFinal).toBe(0);
  });
});
