export interface CatalogOption {
  value: string;
  label: string;
}

/** Título o formación académica del docente (campo libre en BD, no catálogo de cursos) */
export const TEACHER_EDUCATION_LEVEL_OPTIONS: CatalogOption[] = [
  { value: "Técnico nivel superior", label: "Técnico nivel superior" },
  { value: "Licenciado/a en Educación", label: "Licenciado/a en Educación" },
  { value: "Profesor/a de Estado", label: "Profesor/a de Estado" },
  { value: "Magíster en Educación", label: "Magíster en Educación" },
  { value: "Magíster en área disciplinar", label: "Magíster en área disciplinar" },
  { value: "Doctorado", label: "Doctorado" },
  { value: "Otro", label: "Otro" },
];

/** Área de especialización / materia principal del docente */
export const TEACHER_SPECIALIZATION_OPTIONS: CatalogOption[] = [
  { value: "Matemáticas", label: "Matemáticas" },
  { value: "Lenguaje y Comunicación", label: "Lenguaje y Comunicación" },
  { value: "Historia, Geografía y Ciencias Sociales", label: "Historia, Geografía y Ciencias Sociales" },
  { value: "Ciencias Naturales", label: "Ciencias Naturales" },
  { value: "Inglés", label: "Inglés" },
  { value: "Educación Física", label: "Educación Física" },
  { value: "Artes Visuales", label: "Artes Visuales" },
  { value: "Música", label: "Música" },
  { value: "Tecnología", label: "Tecnología" },
  { value: "Religión", label: "Religión" },
  { value: "Orientación / Convivencia escolar", label: "Orientación / Convivencia escolar" },
  { value: "Educación Parvularia", label: "Educación Parvularia" },
  { value: "Jefe de curso", label: "Jefe de curso" },
  { value: "Otra", label: "Otra" },
];

export const CONTRACT_TYPE_OPTIONS: CatalogOption[] = [
  { value: "PLANTA", label: "Planta" },
  { value: "HONORARIOS", label: "Honorarios" },
  { value: "REEMPLAZO", label: "Reemplazo" },
];

export function catalogOptionLabel(
  options: CatalogOption[],
  value?: string | null,
): string {
  if (!value) return "—";
  const match = options.find(
    (option) =>
      option.value === value ||
      option.label === value ||
      option.value.toLowerCase() === value.toLowerCase(),
  );
  return match?.label ?? value;
}
