import type { ModuleTheme } from "../theme/moduleThemes";

import type { TeacherCourseOption } from "../teacher/TeacherCourseContext";



interface TeacherContextBarProps {

  theme: ModuleTheme;

  course: TeacherCourseOption;

  onChangeCourse?: () => void;

  showChangeButton?: boolean;

}



function TeacherContextBar({

  theme,

  course,

  onChangeCourse,

  showChangeButton = false,

}: TeacherContextBarProps) {

  return (

    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5">

      <div className="flex flex-wrap items-center gap-2">

        <span className="text-sm font-medium text-slate-500">Curso activo:</span>

        <span className="text-base font-bold text-slate-800">{course.courseLabel}</span>

        <span

          className={`rounded-full border bg-white px-2.5 py-0.5 text-xs font-semibold ${theme.iconText}`}

        >

          {course.roleLabel}

        </span>

        <span className="text-sm text-slate-500">

          · {course.studentCount} alumno{course.studentCount !== 1 ? "s" : ""}

        </span>

      </div>

      {showChangeButton && onChangeCourse ? (

        <button

          type="button"

          onClick={onChangeCourse}

          className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${theme.primaryBtn}`}

        >

          Cambiar curso

        </button>

      ) : (

        <span className="text-xs text-slate-500">

          Para trabajar en otro curso, vuelve al inicio y cambia <strong>Curso activo</strong>

        </span>

      )}

    </div>

  );

}



export default TeacherContextBar;

