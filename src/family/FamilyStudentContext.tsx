import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getCurrentStudent, type Student } from "../api/students";
import { getGuardianStudents } from "../api/guardians";
import { useAuth } from "../auth/AuthContext";
import { formatStudentFullName } from "../utils/formatStudentFullName";

const WARD_STORAGE_KEY = "familyActiveStudentId";

export interface FamilyStudentOption {
  studentId: number;
  studentLabel: string;
  student: Student;
}

interface FamilyStudentContextValue {
  loading: boolean;
  linked: boolean;
  isGuardianPanel: boolean;
  isStudentPanel: boolean;
  studentOptions: FamilyStudentOption[];
  selectedStudentId: number | null;
  selectedStudent: FamilyStudentOption | null;
  selectStudent: (studentId: number) => void;
  refresh: () => Promise<void>;
}

const FamilyStudentContext = createContext<FamilyStudentContextValue | null>(null);

export function FamilyStudentProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [loading, setLoading] = useState(true);
  const [studentOptions, setStudentOptions] = useState<FamilyStudentOption[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(() => {
    const stored = sessionStorage.getItem(WARD_STORAGE_KEY);
    return stored ? parseInt(stored, 10) : null;
  });

  const isGuardianPanel = auth.isGuardian && !auth.isAdmin;
  const isStudentPanel = auth.isStudent && !auth.isAdmin && !auth.isTeacher;

  const loadData = useCallback(async () => {
    if (!auth.isAuthenticated || (!isGuardianPanel && !isStudentPanel)) {
      setLoading(false);
      setStudentOptions([]);
      return;
    }
    try {
      setLoading(true);
      if (isStudentPanel) {
        const me = await getCurrentStudent();
        if (me) {
          setStudentOptions([
            {
              studentId: me.id,
              studentLabel: formatStudentFullName(me),
              student: me,
            },
          ]);
        } else {
          setStudentOptions([]);
        }
      } else if (isGuardianPanel) {
        const wards = await getGuardianStudents();
        setStudentOptions(
          wards.map((student) => ({
            studentId: student.id,
            studentLabel: formatStudentFullName(student),
            student,
          })),
        );
      }
    } finally {
      setLoading(false);
    }
  }, [auth.isAuthenticated, isGuardianPanel, isStudentPanel]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (loading || studentOptions.length === 0) return;
    const validIds = new Set(studentOptions.map((o) => o.studentId));
    if (selectedStudentId !== null && !validIds.has(selectedStudentId)) {
      setSelectedStudentId(null);
      sessionStorage.removeItem(WARD_STORAGE_KEY);
    }
    if (studentOptions.length === 1) {
      const only = studentOptions[0].studentId;
      if (selectedStudentId !== only) {
        setSelectedStudentId(only);
        sessionStorage.setItem(WARD_STORAGE_KEY, String(only));
      }
    }
  }, [loading, studentOptions, selectedStudentId]);

  const selectedStudent = useMemo(
    () => studentOptions.find((o) => o.studentId === selectedStudentId) ?? null,
    [studentOptions, selectedStudentId],
  );

  const selectStudent = useCallback((studentId: number) => {
    setSelectedStudentId(studentId);
    sessionStorage.setItem(WARD_STORAGE_KEY, String(studentId));
  }, []);

  const value = useMemo<FamilyStudentContextValue>(
    () => ({
      loading,
      linked: studentOptions.length > 0,
      isGuardianPanel,
      isStudentPanel,
      studentOptions,
      selectedStudentId,
      selectedStudent,
      selectStudent,
      refresh: loadData,
    }),
    [
      loading,
      studentOptions,
      isGuardianPanel,
      isStudentPanel,
      selectedStudentId,
      selectedStudent,
      selectStudent,
      loadData,
    ],
  );

  return <FamilyStudentContext.Provider value={value}>{children}</FamilyStudentContext.Provider>;
}

export function useFamilyStudent(): FamilyStudentContextValue {
  const context = useContext(FamilyStudentContext);
  if (!context) {
    throw new Error("useFamilyStudent debe usarse dentro de FamilyStudentProvider");
  }
  return context;
}
