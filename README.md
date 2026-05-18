# 📚 Frontend React - Libro Digital

Frontend del sistema académico **Libro Digital** desarrollado para el ramo Fullstack III (Ingeniería Informática, Duoc Valparaíso).

---

## 🎯 Descripción

Aplicación web construida con React + TypeScript + Tailwind CSS que permite la gestión académica completa.

Se conecta a microservicios backend (`authService` y `academicService`) mediante API REST protegidas con JWT.

---

## 🛠️ Tecnologías

- React 18
- TypeScript
- Vite
- Tailwind CSS
- JWT (Autenticación)
- Fetch API

---

## ✅ Funcionalidades

### 🔐 Autenticación

- Login con JWT
- Token almacenado en localStorage
- Envío automático en headers Authorization
- Logout

---

### 📚 Módulos

#### 👨‍🎓 Estudiantes
- Crear, listar, editar, eliminar
- Búsqueda en tiempo real
- Vista tarjetas y tabla

#### 👨‍🏫 Profesores
- CRUD completo
- Integración con cursos

#### 📖 Asignaturas
- CRUD completo
- Relación con cursos

#### 📝 Matrículas
- Inscripción de estudiantes en cursos
- Relación estudiante–curso
- Visualización con nombres (no IDs)

#### ✍️ Evaluaciones
- CRUD completo
- ✅ Registro de notas
- ✅ Escala chilena (1.0 – 7.0)
- Relación con asignaturas

---

## 🎨 Interfaz

- Diseño responsive
- Cards + tabla en todos los módulos
- Búsqueda dinámica
- Botón de actualizar
- Spinners de carga
- Manejo de errores

---

## 🔌 Conexión Backend

### AuthService (puerto 8081)

Endpoint:
http://localhost:8081/auth/login

Función:
- Genera token JWT

---

### AcademicService (puerto 8082)

Endpoints:

- /students
- /teachers
- /subjects
- /courses
- /enrollments
- /evaluations

Requiere:
Authorization: Bearer {token}

---

## 🛠️ Instalación

Ejecutar en la carpeta frontend:

npm install

---

## 🚀 Ejecución

npm run dev

Abrir en navegador:

http://localhost:5173

---

## 🔐 Autenticación

El sistema usa JWT:

1. Usuario inicia sesión
2. Recibe token
3. El token se guarda en localStorage
4. Se envía en cada request:

Authorization: Bearer {token}

---

## 🏗️ Estructura

frontend-react/
├── src/
│   ├── api/
│   │   ├── auth.ts
│   │   ├── courses.ts
│   │   ├── students.ts
│   │   ├── subjects.ts
│   │   ├── enrollments.ts
│   │   ├── evaluations.ts
│   │   └── teachers.ts
│   ├── App.tsx
│   ├── Login.tsx
│   ├── Courses.tsx
│   ├── Students.tsx
│   ├── Subjects.tsx
│   ├── Enrollments.tsx
│   ├── Evaluations.tsx
│   ├── main.tsx
│   └── styles
├── public/
├── package.json
├── vite.config.ts
└── README.md

---

## ✅ Estado del Proyecto

✔ CRUD completo  
✔ Interfaz moderna  
✔ JWT funcionando  
✔ Integración con microservicios  
✔ Evaluaciones con notas chilenas  

---

## 👨‍💻 Autores

- Cristian Monsalve  
- Hector Olivares  

---

## 📌 Observaciones

El frontend está totalmente desacoplado del backend y consume APIs REST mediante Fetch.

El sistema mantiene consistencia visual entre todos los módulos, reutilizando patrones de interfaz.

Incluye autenticación segura con JWT y control de acceso a rutas protegidas.
