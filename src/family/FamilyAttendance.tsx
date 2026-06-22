import { useCallback, useEffect, useMemo, useState } from "react";
import { getAttendancesByStudent } from "../api/attendances";
import type { AttendanceRecord } from "../api/attendances";
import ViewDetailModal, { type DetailField } from "../components/ViewDetailModal";
import RecordActions from "../components/RecordActions";
import ModuleLayout from "../components/ModuleLayout";
import ModuleHelpBanner from "../components/ModuleHelpBanner";
import { moduleThemes } from "../theme/moduleThemes";
import {
  attendanceSearchText,
  compareAttendanceBySessionDate,
  formatAttendanceClassLabel,
  formatSessionDate,
} from "../utils/formatAttendanceSession";
import FamilyStudentPicker, { FamilyStudentRequired } from "./FamilyStudentPicker";
import FamilyStudentContextBar from "./FamilyStudentContextBar";
import { useFamilyStudent } from "./FamilyStudentContext";

interface FamilyAttendanceProps {
  onBack: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  PRESENTE: "Presente",
  AUSENTE: "Ausente",
  ATRASADO: "Atrasado",
  JUSTIFICADO: "Justificado",
};

export default function FamilyAttendance({ onBack }: FamilyAttendanceProps) {
  const theme = moduleThemes.myAttendance;
  const { selectedStudent, isGuardianPanel } = useFamilyStudent();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [viewingRecord, setViewingRecord] = useState<AttendanceRecord | null>(null);

  const load = useCallback(async () => {
    if (!selectedStudent) {
      setLoading(false);
      setRecords([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await getAttendancesByStudent(selectedStudent.studentId);
      setRecords([...data].sort(compareAttendanceBySessionDate));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar asistencia");
    } finally {
      setLoading(false);
    }
  }, [selectedStudent]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredRecords = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return records;
    return records.filter((record) => {
      const statusLabel = (STATUS_LABELS[record.status] ?? record.status).toLowerCase();
      return statusLabel.includes(q) || attendanceSearchText(record).includes(q);
    });
  }, [records, searchTerm]);

  const statusLabel = (status: string) => STATUS_LABELS[status] ?? status;

  const detailFields = (record: AttendanceRecord): DetailField[] => [
    { label: "Fecha de clase", value: formatSessionDate(record.sessionDate) },
    { label: "Asignatura", value: record.subjectName },
    { label: "Tema", value: record.topic, fullWidth: true },
    { label: "Estado", value: statusLabel(record.status) },
    { label: "Alumno", value: record.studentName ?? selectedStudent?.studentLabel },
    { label: "Observaciones", value: record.observations, fullWidth: true },
    { label: "Registrado", value: record.createdAt ? new Date(record.createdAt).toLocaleString("es-CL") : undefined },
    { label: "Actualizado", value: record.updatedAt ? new Date(record.updatedAt).toLocaleString("es-CL") : undefined },
  ];

  return (
    <>
      <ModuleLayout
        theme={theme}
        onBack={onBack}
        createLabel=""
        onCreate={() => {}}
        canCreate={false}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por fecha, asignatura o estado..."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={load}
        loading={loading}
        error={error}
      >
        <FamilyStudentPicker theme={theme} />
        {!loading && !selectedStudent && <FamilyStudentRequired theme={theme} onBack={onBack} />}

        {selectedStudent && (
          <ModuleHelpBanner>
            Historial de asistencia de <strong>{selectedStudent.studentLabel}</strong> (solo lectura).
          </ModuleHelpBanner>
        )}

        {selectedStudent && !loading && (
          <FamilyStudentContextBar
            theme={theme}
            student={selectedStudent}
            isGuardianPanel={isGuardianPanel}
          />
        )}

        {selectedStudent && !loading && records.length === 0 && (
          <div className="py-12 text-center text-slate-500">No hay registros de asistencia.</div>
        )}

        {selectedStudent && !loading && records.length > 0 && filteredRecords.length === 0 && (
          <div className="py-12 text-center text-slate-500">
            <div className="mb-4 text-6xl">🔍</div>
            <p>No hay registros que coincidan con la búsqueda</p>
          </div>
        )}

        {selectedStudent && filteredRecords.length > 0 && viewMode === "cards" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredRecords.map((record) => (
              <div key={record.id} className={theme.cardClass}>
                <div className="mb-4 text-4xl">📅</div>
                <h3 className="mb-1 text-lg font-semibold text-slate-800">
                  {formatSessionDate(record.sessionDate)}
                </h3>
                <p className="text-sm font-medium text-slate-700">
                  {record.subjectName ?? "Asignatura no disponible"}
                </p>
                {record.topic && (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">Tema: {record.topic}</p>
                )}
                <p className="mt-2 text-sm font-medium text-slate-700">
                  Estado: {statusLabel(record.status)}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                  {record.observations ?? "Sin observaciones"}
                </p>
                <div className="mt-4">
                  <RecordActions
                    onView={() => setViewingRecord(record)}
                    onEdit={() => {}}
                    onDelete={() => {}}
                    canEdit={false}
                    canDelete={false}
                    compact
                    stretch
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedStudent && filteredRecords.length > 0 && viewMode === "table" && (
          <div className={theme.tableWrap}>
            <table className="w-full text-sm">
              <thead className={theme.tableHead}>
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                  <th className="px-4 py-3 text-left font-semibold">Asignatura</th>
                  <th className="px-4 py-3 text-left font-semibold">Estado</th>
                  <th className="px-4 py-3 text-left font-semibold">Observaciones</th>
                  <th className="px-4 py-3 text-center font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id} className={`border-t border-slate-100 ${theme.tableRowHover}`}>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-800">
                      {formatSessionDate(record.sessionDate)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{record.subjectName ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{statusLabel(record.status)}</td>
                    <td className="px-4 py-3 text-slate-600">{record.observations ?? "—"}</td>
                    <td className="px-4 py-3">
                      <RecordActions
                        onView={() => setViewingRecord(record)}
                        onEdit={() => {}}
                        onDelete={() => {}}
                        canEdit={false}
                        canDelete={false}
                        compact
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ModuleLayout>

      {viewingRecord && (
        <ViewDetailModal
          title="Detalle de asistencia"
          subtitle={formatAttendanceClassLabel(viewingRecord)}
          theme={theme}
          fields={detailFields(viewingRecord)}
          onClose={() => setViewingRecord(null)}
        />
      )}
    </>
  );
}
