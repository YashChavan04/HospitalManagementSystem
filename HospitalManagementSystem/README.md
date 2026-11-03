# MediTrack — Hospital Management System

A full-stack Hospital Management System built on top of the Spring Boot
"Employee Management" workshop project. The backend architecture
(Controller → Service → Repository, DTOs, JWT auth) is the same pattern
your mentor taught — this project extends it into a multi-entity domain
with role-based access, business-rule validation, and a real frontend.

---

## 1. What's different from the original workshop project

| Original (Employee Management) | This project (Hospital Management) |
|---|---|
| One entity: `Employee` | Five entities: `User`, `Department`, `Doctor`, `Patient`, `Appointment` |
| One role check (`ADMIN`) | Three roles: `ADMIN`, `RECEPTIONIST`, `DOCTOR`, each with different permissions per endpoint |
| No relationships | `Doctor → Department` (many-to-one), `Appointment → Doctor` + `Appointment → Patient` (many-to-one each) |
| No business rules | Double-booking prevention: a doctor cannot have two active appointments at the same date & time |
| Basic error responses | Centralised `@RestControllerAdvice` returning a consistent JSON error shape for every failure |
| No frontend | Full HTML/CSS/JS frontend (5 pages) that consumes the REST API with JWT stored client-side |
| No dashboard/reporting | `/api/dashboard/stats` endpoint + a dashboard page with live counts |
| Search was basic | Search/filter endpoints: doctors by department or specialization, patients by name, appointments by doctor/patient/status/date |
| No triage/urgency concept | Every appointment has a priority (Routine/Urgent/Critical); the appointments queue sorts critical cases to the top regardless of booking time |
| Dashboard was 4 numbers | Full analytics dashboard: 7-day appointment trend, busiest doctors, load by department, patient gender split, and peak-hour demand, all charted with Chart.js |
| No medical record concept | Prescriptions (medicine, dosage, frequency, duration) attach to a completed appointment, and each patient has a full visit timeline showing every past appointment and what was prescribed |

---

## 2. Project structure

```
HospitalManagementSystem/
├── backend/                     Spring Boot REST API
│   ├── pom.xml
│   └── src/main/java/com/tcet/hms/
│       ├── model/                Entities (User, Department, Doctor, Patient, Appointment, AppointmentStatus)
│       ├── modeldto/             Request/response DTOs (never expose entities directly)
│       ├── repositorys/          Spring Data JPA repositories
│       ├── service/              Business logic
│       ├── controller/           REST endpoints
│       ├── security/             JWT filter, JwtService, SecurityConfig, UserDetailsService
│       └── exception/            Custom exceptions + global exception handler
└── frontend/                     Static HTML/CSS/JS (no build step required)
    ├── index.html                 Login + staff registration
    ├── dashboard.html
    ├── patients.html
    ├── doctors.html
    ├── departments.html
    ├── appointments.html
    ├── css/style.css
    └── js/  (api.js, ui.js, and one file per page)
```

---

## 3. Running the backend

1. **Create the database:**
   ```sql
   CREATE DATABASE hospitalmanagement;
   ```
2. **Set your MySQL credentials** in
   `backend/src/main/resources/application.properties`
   (`spring.datasource.username` / `spring.datasource.password`).
3. **Run it** from the `backend` folder:
   ```bash
   mvn spring-boot:run
   ```
   or import `backend` as a Maven project in IntelliJ / Eclipse / VS Code
   and run `HmsApplication`.
4. Tables are created automatically (`spring.jpa.hibernate.ddl-auto=update`).
5. On first startup a default admin account is created automatically —
   watch the console for a line like:
   ```
   Default admin created -> username: admin | password: admin123
   ```

The API runs on **http://localhost:8080**.

---

## 4. Running the frontend

No build step, no Node required — it's plain HTML/CSS/JS.

- **Easiest:** open `frontend/index.html` directly in a browser, or
- **Recommended:** serve it with a simple static server so relative paths
  and CORS behave exactly like a real deployment, e.g. with VS Code's
  "Live Server" extension, or:
  ```bash
  cd frontend
  python3 -m http.server 5500
  ```
  then visit `http://localhost:5500`.

If you use a different port than `5500`, add it to
`app.cors.allowed-origins` in `application.properties`.

Log in with `admin` / `admin123` to explore every screen first.

---

## 5. Roles and what each one can do

| Role | Can do |
|---|---|
| **ADMIN** | Everything: manage departments, doctors, patients, appointments, and view the dashboard |
| **RECEPTIONIST** | Register/edit patients, book appointments, update appointment status, view doctors & departments (read-only) |
| **DOCTOR** | View only their own appointments (via the `doctorId` linked to their login), update appointment status and add notes |

To create a RECEPTIONIST or DOCTOR login, use "Register" on the login
page (in a real deployment this would be an admin-only action inside the
app rather than a public link — flagged in the code with a comment).
For a `DOCTOR` account, add the doctor's profile under **Doctors** first
(as an admin), note their ID, then register a login with that
`doctorId`.

---

## 6. The three standout features (added on top of the base CRUD system)

**Triage priority.** Every appointment carries a priority: `ROUTINE`, `URGENT`, or `CRITICAL`. The appointments queue always sorts critical cases to the top, ahead of anything scheduled earlier - `AppointmentService` stores it, the frontend (`appointments.js`) does the priority-aware sort, and critical rows get a distinct red highlight in the table (`priority-critical-row` in `style.css`).

**Analytics dashboard.** `DashboardService.getStats()` computes five extra aggregates purely in Java (no complex SQL needed): a 7-day appointment trend, the top 5 busiest doctors, appointment load per department, patient gender split, and a peak-hours breakdown. The dashboard renders all five as charts drawn directly with the native HTML5 Canvas API (`dashboard.js`) - deliberately not using an external charting library, so the dashboard has zero dependency on internet access or a CDN being reachable.

**Prescriptions & medical history.** A `Prescription` (general instructions) can hold multiple `PrescriptionItem`s (medicine, dosage, frequency, duration), one prescription per appointment. `MedicalHistoryService` joins a patient's appointments with whatever prescription each one produced into a single timeline (`GET /api/patients/{id}/medical-history`), rendered as a scrollable visit history from the Patients page. Only ADMIN/DOCTOR can write a prescription (enforced in `SecurityConfig` with a rule specific enough to override the broader appointments rule beneath it).

## 7. Notable backend design decisions (useful for your viva)

- **DTOs everywhere** — controllers never accept or return JPA entities
  directly. This avoids leaking internal fields (like password hashes)
  and avoids infinite-recursion JSON serialization on bidirectional
  relationships.
- **`@ToString.Exclude` / `@EqualsAndHashCode.Exclude`** on the
  `List<Doctor>` / `List<Appointment>` sides of relationships — without
  this, Lombok's generated `toString()`/`equals()` on `Doctor` ↔
  `Appointment` ↔ `Patient` would recurse into each other forever
  (a classic bidirectional-JPA-entity + Lombok pitfall).
- **Global exception handling** (`GlobalExceptionHandler`) turns
  `ResourceNotFoundException` → 404, `AppointmentConflictException` → 409,
  validation failures → 400, bad login → 401, with a consistent JSON
  body the frontend can read `message` from directly.
- **Appointment conflict check** is a real business rule, not just CRUD:
  `AppointmentService.create()` queries for an existing *active*
  appointment for the same doctor at the same date/time before allowing
  a booking.
- **Method-level security** (`hasRole` / `hasAnyRole` per HTTP verb in
  `SecurityConfig`) is layered on top of "any authenticated user" reads,
  so read access is broad but writes are locked down per role.
- **Stateless JWT auth** — no server-side session; `JwtAuthenticationFilter`
  runs once per request, validates the token, and populates the
  `SecurityContext` before Spring Security's authorization checks run.

---

## 8. Ideas if you want to extend this further

- Add a `Bill`/`Invoice` entity generated when an appointment is marked `COMPLETED`.
- Add pagination (`Pageable`) to the list endpoints once data volume grows.
- Add a calendar-style view (day/week grid) on the appointments page instead of a flat table.
- Add email/SMS reminders using Spring's `JavaMailSender` (would need an external service).
- Add refresh tokens instead of a single long-lived JWT.
- Add a QR-code check-in flow (generate on booking, scan to mark `CHECKED_IN`).

These are good "future work" talking points for a viva without needing
to actually build them right now.
