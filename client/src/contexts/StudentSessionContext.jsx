/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useMyProfileQuery } from '../queries/userProfileQueries';

const StudentSessionContext = createContext(null);

export const StudentSessionProvider = ({ children }) => {
  const { user } = useAuth();
  const { data: profile } = useMyProfileQuery();

  const currentUser = profile?.user || user;
  const studentMeta = profile?.profileMeta || {};

  const userRole = currentUser?.role;
  const isStudent = userRole === 'STUDENT';

  const admissionYear = Number(currentUser?.admissionYear) || 2024;
  const activeSemester = Math.max(1, Number(currentUser?.semester) || Number(studentMeta?.semester) || 1);

  // Selected semester defaults to the student's active semester
  const [selectedSemester, setInternalSelectedSemester] = useState(activeSemester);
  const [isManualSelection, setIsManualSelection] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(currentUser?._id || currentUser?.id);

  // Synchronize whenever user changes or when activeSemester resolves from database
  useEffect(() => {
    const newUserId = currentUser?._id || currentUser?.id;
    if (newUserId && newUserId !== currentUserId) {
      setCurrentUserId(newUserId);
      setIsManualSelection(false);
      setInternalSelectedSemester(activeSemester);
    } else if (!isManualSelection) {
      // If user has not explicitly picked a past semester, automatically track activeSemester as it resolves
      setInternalSelectedSemester(activeSemester);
    } else {
      // If manually selected, ensure it doesn't exceed newly resolved activeSemester
      setInternalSelectedSemester((prev) => (prev > activeSemester ? activeSemester : prev));
    }
  }, [currentUser?._id, currentUser?.id, currentUserId, activeSemester, isManualSelection]);

  // Read-only state when looking at historical/cleared semesters
  const isArchivedView = isStudent && selectedSemester < activeSemester;

  // List of semesters from 1 up to the current active semester
  const availableSemesters = useMemo(() => {
    if (!isStudent) return [];
    const list = [];
    for (let s = 1; s <= activeSemester; s++) {
      const yearOffset = Math.floor((s - 1) / 2);
      const termYear = admissionYear + yearOffset;
      const isOdd = s % 2 !== 0;
      const termType = isOdd ? 'ODD' : 'EVEN';
      const academicSession = `${termYear}–${termYear + 1}`;
      const isCurrent = s === activeSemester;
      const isPassed = s < activeSemester;

      list.push({
        semester: s,
        termType,
        academicSession,
        isCurrent,
        isPassed,
        label: isCurrent
          ? `Semester ${s} (Current Active)`
          : `Semester ${s} (Passed)`,
        subLabel: `${academicSession} • ${termType} Term`,
      });
    }
    return list;
  }, [isStudent, activeSemester, admissionYear]);

  const handleSetSelectedSemester = (sem) => {
    const numericSem = Number(sem) || activeSemester;
    setIsManualSelection(true);
    setInternalSelectedSemester(Math.min(numericSem, activeSemester));
  };

  const resetToActive = () => {
    setIsManualSelection(false);
    setInternalSelectedSemester(activeSemester);
  };

  const value = {
    isStudent,
    activeSemester,
    selectedSemester: selectedSemester || activeSemester,
    setSelectedSemester: handleSetSelectedSemester,
    isArchivedView,
    availableSemesters,
    resetToActive,
    admissionYear,
  };

  return (
    <StudentSessionContext.Provider value={value}>
      {children}
    </StudentSessionContext.Provider>
  );
};

export const useStudentSession = () => {
  const context = useContext(StudentSessionContext);
  if (!context) {
    return {
      isStudent: false,
      activeSemester: 1,
      selectedSemester: 1,
      setSelectedSemester: () => {},
      isArchivedView: false,
      availableSemesters: [],
      resetToActive: () => {},
      admissionYear: 2024,
    };
  }
  return context;
};

export default StudentSessionContext;
