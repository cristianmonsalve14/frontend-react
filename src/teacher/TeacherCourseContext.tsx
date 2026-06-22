import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getCourses } from "../api/courses";
import type { Course } from "../api/courses";
import { getEnrollments } from "../api/enrollments";
import type { Enrollment } from "../api/enrollments";
import { getSubjects } from "../api/subjects";
import type { Subject } from "../api/subjects";
import { getStudents } from "../api/students";
import type { Student } from "../api/students";
import { getCurrentTeacher } from "../api/teachers";
import { useAuth } from "../auth/AuthContext";
import { formatCourseLabel } from "../utils/formatCourseLabel";
import { formatStudentFullName } from "../utils/formatStudentFullName";
import { sortById } from "../utils/sortById";

const COURSE_STORAGE_KEY = "teacherActiveCourseId";

export interface TeacherCourseOption {
  courseId: number;
  courseLabel: string;
  studentCount: number;
  roleLabel: string;
}

interface TeacherCourseContextValue {
  loading: boolean;
  teacherId: number | null;
  courses: Course[];
  subjects: Subject[];
  enrollments: Enrollment[];
  students: Student[];
  courseOptions: TeacherCourseOption[];
  selectedCourseId: number | null;
  selectedCourse: TeacherCourseOption | null;
  courseSubjects: Subject[];
  courseStudents: Student[];
  showCoursePicker: boolean;
  setShowCoursePicker: (open: boolean) => void;
  selectCourse: (courseId: number) => void;
  refresh: () => Promise<void>;
}

const TeacherCourseContext = createContext<TeacherCourseContextValue | null>(null);

export function TeacherCourseProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState<number | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(() => {
    const stored = sessionStorage.getItem(COURSE_STORAGE_KEY);
    return stored ? parseInt(stored, 10) : null;
  });
  const [showCoursePicker, setShowCoursePicker] = useState(false);

  const isTeacherPanel = auth.isTeacher && !auth.isAdmin;

  const loadData = useCallback(async () => {
    if (!auth.isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [coursesData, subjectsData, enrollmentsData, studentsData] = await Promise.all([
        getCourses(),
        getSubjects(),
        getEnrollments(),
        getStudents(),
      ]);
      setCourses(sortById(coursesData));
      setSubjects(sortById(subjectsData));
      setEnrollments(sortById(enrollmentsData));
      setStudents(sortById(studentsData));

      if (isTeacherPanel) {
        const me = await getCurrentTeacher();
        setTeacherId(me?.id ?? null);
      } else {
        setTeacherId(null);
      }
    } finally {
      setLoading(false);
    }
  }, [auth.isAuthenticated, isTeacherPanel]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const courseById = useMemo(
    () => new Map(courses.map((course) => [course.id, course])),
    [courses],
  );

  const studentById = useMemo(
    () => new Map(students.map((student) => [student.id, student])),
    [students],
  );

  const getCourseRole = useCallback(
    (course: Course): string => {
      if (isTeacherPanel && teacherId) {
        return course.headTeacherId === teacherId ? "Profesor jefe" : "Profesor asignado";
      }
      return "Curso";
    },
    [isTeacherPanel, teacherId],
  );

  const courseOptions: TeacherCourseOption[] = useMemo(() => {
    const ids = new Set<number>();
    if (isTeacherPanel && teacherId) {
      courses.forEach((course) => {
        if (course.headTeacherId === teacherId) ids.add(course.id);
      });
      subjects.forEach((subject) => {
        if (subject.teacherId === teacherId && subject.courseId) ids.add(subject.courseId);
      });
    } else {
      courses.forEach((course) => ids.add(course.id));
    }

    return Array.from(ids)
      .map((courseId) => {
        const course = courseById.get(courseId);
        const studentCount = enrollments.filter((e) => e.courseId === courseId).length;
        return {
          courseId,
          courseLabel: course ? formatCourseLabel(course) : `Curso ${courseId}`,
          studentCount,
          roleLabel: course ? getCourseRole(course) : "Curso",
        };
      })
      .sort((a, b) => a.courseLabel.localeCompare(b.courseLabel, "es"));
  }, [courses, subjects, teacherId, isTeacherPanel, courseById, enrollments, getCourseRole]);

  useEffect(() => {
    if (!isTeacherPanel || loading || courseOptions.length === 0) return;

    const validIds = new Set(courseOptions.map((o) => o.courseId));
    if (selectedCourseId !== null && !validIds.has(selectedCourseId)) {
      setSelectedCourseId(null);
      sessionStorage.removeItem(COURSE_STORAGE_KEY);
    }

    if (courseOptions.length === 1) {
      const only = courseOptions[0].courseId;
      if (selectedCourseId !== only) {
        setSelectedCourseId(only);
        sessionStorage.setItem(COURSE_STORAGE_KEY, String(only));
      }
      setShowCoursePicker(false);
      return;
    }

  }, [isTeacherPanel, loading, courseOptions, selectedCourseId]);

  const selectedCourse = useMemo(
    () => courseOptions.find((option) => option.courseId === selectedCourseId) ?? null,
    [courseOptions, selectedCourseId],
  );

  const courseSubjects = useMemo(() => {
    if (!selectedCourseId) return [];
    const course = courseById.get(selectedCourseId);
    const isHeadTeacher = isTeacherPanel && teacherId && course?.headTeacherId === teacherId;
    return subjects.filter((subject) => {
      if (subject.courseId !== selectedCourseId) return false;
      if (isTeacherPanel && teacherId && !isHeadTeacher) {
        return subject.teacherId === teacherId;
      }
      return true;
    });
  }, [subjects, selectedCourseId, isTeacherPanel, teacherId, courseById]);

  const courseStudents = useMemo(() => {
    if (!selectedCourseId) return [];
    return enrollments
      .filter((enrollment) => enrollment.courseId === selectedCourseId)
      .map((enrollment) => studentById.get(enrollment.studentId))
      .filter((student): student is Student => student !== undefined)
      .sort((a, b) => formatStudentFullName(a).localeCompare(formatStudentFullName(b), "es"));
  }, [selectedCourseId, enrollments, studentById]);

  const selectCourse = useCallback((courseId: number) => {
    setSelectedCourseId(courseId);
    sessionStorage.setItem(COURSE_STORAGE_KEY, String(courseId));
    setShowCoursePicker(false);
  }, []);

  const value = useMemo<TeacherCourseContextValue>(
    () => ({
      loading,
      teacherId,
      courses,
      subjects,
      enrollments,
      students,
      courseOptions,
      selectedCourseId,
      selectedCourse,
      courseSubjects,
      courseStudents,
      showCoursePicker,
      setShowCoursePicker,
      selectCourse,
      refresh: loadData,
    }),
    [
      loading,
      teacherId,
      courses,
      subjects,
      enrollments,
      students,
      courseOptions,
      selectedCourseId,
      selectedCourse,
      courseSubjects,
      courseStudents,
      showCoursePicker,
      selectCourse,
      loadData,
    ],
  );

  return (
    <TeacherCourseContext.Provider value={value}>{children}</TeacherCourseContext.Provider>
  );
}

export function useTeacherCourse(): TeacherCourseContextValue {
  const context = useContext(TeacherCourseContext);
  if (!context) {
    throw new Error("useTeacherCourse debe usarse dentro de TeacherCourseProvider");
  }
  return context;
}

/** Solo para módulos docentes; no lanza error si el provider no aplica */
export function useTeacherCourseOptional(): TeacherCourseContextValue | null {
  return useContext(TeacherCourseContext);
}
