# MedFlow Backend Handoff

## Project Context

This frontend is currently a mock-data Next.js application. Authentication, appointments, staff, and inventory are stored in local Zustand stores or seed data files. There is no real backend yet.

This document describes the current frontend data model and the backend contract the frontend will need when real APIs are added.

## Current Frontend Sources

- Auth mock users: `src/data/mockUsers.ts`
- Appointments seed data: `src/data/appointments.ts`
- Shared TypeScript models: `src/types/index.ts`
- Auth state: `src/stores/useAuthStore.ts`
- Staff state: `src/stores/useStaffStore.ts`
- Booking state: `src/stores/useBookingStore.ts`
- Chat message state: `src/stores/useChatStore.ts`
- Floating chatbot UI: `src/components/shared/PatientChat.tsx`
- Chatbot popup flow: `src/components/shared/ChatBot.tsx`
- Global mount point: `src/components/shared/Providers.tsx`

## Main Entities

### 1. Users / Auth Users

Current frontend auth users are role-based.

```ts
type Role = "PATIENT" | "MEDICAL_ADMIN" | "DOCTOR" | "RECEPTION" | "SUPER_ADMIN";

interface AuthUser {
  id: string;
  name: string;
  nameAr: string;
  email: string;
  role: Role;
  phone?: string;
}
```

Mock auth records currently also contain:

```ts
{
  password: string,
  avatar?: string
}
```

### 2. Staff

Staff is currently used for doctor and reception records.

```ts
interface StaffMember {
  id: string;
  name: string;
  nameAr: string;
  email: string;
  phone: string;
  role: "DOCTOR" | "RECEPTION";
  specialty?: string;
  specialtyAr?: string;
  status: "active" | "on-leave" | "inactive";
  shift?: string;
  experience?: number;
  rating?: number;
  avatar?: string;
  joinDate: string;
}
```

Notes:

- Doctors use `specialty`, `specialtyAr`, `experience`, and `rating`
- Reception users use `shift`
- Doctor IDs like `staff-1`, `staff-2` are important because appointments reference them

### 3. Appointments

Appointments are the most important shared entity in the app.

```ts
interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "in-progress";
  type: string;
  notes?: string;
}
```

Example:

```json
{
  "id": "apt-1",
  "patientId": "p-1",
  "patientName": "Sarah Johnson",
  "doctorId": "staff-1",
  "doctorName": "Dr. Sarah Mitchell",
  "specialty": "Cardiology",
  "date": "2026-04-07",
  "time": "09:00",
  "status": "scheduled",
  "type": "Consultation"
}
```

### 4. Inventory

```ts
interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  status: "in-stock" | "low" | "out-of-stock";
  lastUpdated: string;
  supplier: string;
  price: number;
}
```

### 5. System Logs

```ts
interface SystemLog {
  id: string;
  action: string;
  user: string;
  role: Role;
  timestamp: string;
  details: string;
  level: "info" | "warning" | "error";
}
```

## Important Relationships

These are the relationships the frontend currently depends on:

- `appointments.patientId -> auth/user id`
- `appointments.doctorId -> staff.id`
- doctor dashboards filter by `doctorId`
- patient dashboards filter by `patientId`
- doctor appointment screens also display `doctorName`
- patient appointment screens also display `patientName`

Important frontend expectation:

- Doctor login users must map to the same doctor IDs used in staff and appointments
- Example:
  - doctor auth user id: `staff-1`
  - matching staff doctor id: `staff-1`
  - appointment doctor id: `staff-1`

## Current Frontend Business Flows

### 1. Login

Current frontend login behavior:

- check hardcoded mock users first
- if no match, check locally registered signup users
- on success, store the authenticated user in the auth store
- route user by role:
  - `PATIENT -> /dashboard`
  - `DOCTOR -> /doctor/dashboard`
  - `RECEPTION -> /reception/dashboard`
  - `MEDICAL_ADMIN -> /admin/dashboard`
  - `SUPER_ADMIN -> /super-dashboard`

### 2. Signup

Current frontend signup behavior:

- creates a local browser-only user
- stores it in `registeredUsers`
- auto-logs in as `PATIENT`

Backend note:

- real backend should create a proper patient user record and return the authenticated session/user

### 3. Patient Appointment Booking

Current frontend booking behavior:

- patient selects doctor
- patient selects date
- patient selects time
- frontend creates appointment with:
  - `patientId`
  - `patientName`
  - `doctorId`
  - `doctorName`
  - `specialty`
  - `date`
  - `time`
  - `status = "scheduled"`
  - `type = "Consultation"`

Then payment step has two frontend options:

- `Pay Online`
- `Pay Onsite`

Both currently update the appointment to:

```ts
status: "confirmed"
```

Difference is only the UI message right now.

Backend note:

- a real backend should likely store payment method separately
- current frontend does not yet persist a payment field in the appointment model

### 4. Reception Booking

Reception booking also creates appointments using real doctor staff IDs, so backend should use the same appointment entity and relationships.

## Recommended Backend Tables / Collections

This is the cleanest shape based on the current frontend.

### users

```ts
{
  id: string,
  name: string,
  nameAr?: string,
  email: string,
  passwordHash: string,
  role: "PATIENT" | "MEDICAL_ADMIN" | "DOCTOR" | "RECEPTION" | "SUPER_ADMIN",
  phone?: string,
  avatar?: string,
  createdAt: string,
  updatedAt: string
}
```

### staff_profiles

Use this if doctor/reception profile data is kept separate from base users.

```ts
{
  id: string,
  userId: string,
  role: "DOCTOR" | "RECEPTION",
  specialty?: string,
  specialtyAr?: string,
  status: "active" | "on-leave" | "inactive",
  shift?: string,
  experience?: number,
  rating?: number,
  joinDate: string
}
```

### appointments

```ts
{
  id: string,
  patientId: string,
  doctorId: string,
  date: string,
  time: string,
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "in-progress",
  type: string,
  notes?: string,
  paymentMethod?: "online" | "onsite",
  paymentStatus?: "pending" | "paid" | "pay-later",
  createdAt: string,
  updatedAt: string
}
```

Frontend currently duplicates `patientName`, `doctorName`, and `specialty`, but backend can compute these through joins if desired. The frontend can adapt later, but right now it expects those values in rendered appointment views.

### inventory

```ts
{
  id: string,
  name: string,
  category: string,
  stock: number,
  minStock: number,
  unit: string,
  status: "in-stock" | "low" | "out-of-stock",
  lastUpdated: string,
  supplier: string,
  price: number
}
```

### system_logs

```ts
{
  id: string,
  action: string,
  userId?: string,
  userName?: string,
  role?: string,
  timestamp: string,
  details: string,
  level: "info" | "warning" | "error"
}
```

## API Endpoints the Frontend Will Need

### Auth

`POST /auth/login`

Request:

```json
{
  "email": "doctor@clinic.com",
  "password": "123456"
}
```

Response:

```json
{
  "token": "jwt-or-session-token",
  "user": {
    "id": "staff-1",
    "name": "Dr. Sarah Mitchell",
    "nameAr": "د. سارة ميتشل",
    "email": "doctor@clinic.com",
    "role": "DOCTOR",
    "phone": "+1 555-0103"
  }
}
```

`POST /auth/signup`

Request:

```json
{
  "name": "New Patient",
  "email": "new@patient.com",
  "phone": "+1 555-9999",
  "password": "123456"
}
```

Response:

```json
{
  "token": "jwt-or-session-token",
  "user": {
    "id": "p-10",
    "name": "New Patient",
    "nameAr": "New Patient",
    "email": "new@patient.com",
    "role": "PATIENT",
    "phone": "+1 555-9999"
  }
}
```

### Staff / Doctors

`GET /staff/doctors`

Response:

```json
[
  {
    "id": "staff-1",
    "name": "Dr. Sarah Mitchell",
    "nameAr": "د. سارة ميتشل",
    "email": "sarah.mitchell@clinic.com",
    "phone": "+1 555-0201",
    "role": "DOCTOR",
    "specialty": "Cardiology",
    "specialtyAr": "أمراض القلب",
    "status": "active",
    "experience": 15,
    "rating": 4.9,
    "avatar": "https://...",
    "joinDate": "2022-03-15"
  }
]
```

### Appointments

`GET /appointments`

Suggested filters:

- `patientId`
- `doctorId`
- `date`
- `status`

`POST /appointments`

Request:

```json
{
  "patientId": "p-1",
  "doctorId": "staff-1",
  "date": "2026-04-12",
  "time": "09:30",
  "type": "Consultation",
  "notes": ""
}
```

Suggested response:

```json
{
  "id": "apt-100",
  "patientId": "p-1",
  "patientName": "Sarah Johnson",
  "doctorId": "staff-1",
  "doctorName": "Dr. Sarah Mitchell",
  "specialty": "Cardiology",
  "date": "2026-04-12",
  "time": "09:30",
  "status": "scheduled",
  "type": "Consultation"
}
```

`PATCH /appointments/:id`

Used for:

- confirming appointment
- completing appointment
- cancelling appointment
- attaching payment metadata later

Example:

```json
{
  "status": "confirmed",
  "paymentMethod": "online",
  "paymentStatus": "paid"
}
```

### Inventory

`GET /inventory`

`PATCH /inventory/:id`

### Logs

`GET /logs`

## Chatbot Backend Handoff

The frontend now includes a floating chatbot that is mounted globally and can be opened by both guests and authenticated users.

### Current Chatbot Behavior

- First step is always language selection:
  - Arabic
  - English
- If the user is not logged in:
  - chatbot blocks booking flow
  - chatbot shows login/register actions
  - no appointment is created
- If the user is logged in:
  - chatbot offers quick replies for specialties, doctors, and time slots
  - chatbot can interpret simple typed input
  - chatbot currently creates an appointment directly through `useBookingStore.addAppointment(...)`
- Current chat messages are browser-local only and stored in `useChatStore`

### Important Frontend Files

- `src/components/shared/ChatBot.tsx`
  - main conversational logic
  - language gate
  - auth-aware branching
  - quick replies and fallback suggestions
  - currently books through local Zustand store
- `src/components/shared/PatientChat.tsx`
  - floating button open/close state
  - unread-count display
- `src/stores/useChatStore.ts`
  - local message persistence
- `src/stores/useAuthStore.ts`
  - current auth/session source used by the chatbot
- `src/stores/useBookingStore.ts`
  - current appointment creation source used by the chatbot
- `src/stores/useStaffStore.ts`
  - source for doctors and specialties shown by the chatbot

### Recommended Backend API Surface for Chatbot

Minimum useful contract:

- `GET /auth/me`
  - returns current authenticated user/session
- `GET /doctors`
  - returns doctors with bilingual names and specialties
- `GET /specialties`
  - optional, can be derived from doctors if backend prefers
- `GET /doctors/:id/slots?date=YYYY-MM-DD`
  - returns available time slots
- `POST /appointments`
  - creates a booking
- `POST /chatbot/message`
  - optional if real assistant logic moves to backend later

### Suggested Response Shapes

Doctor records should continue to support frontend bilingual rendering:

```json
{
  "id": "staff-1",
  "name": "Dr. Sarah Mitchell",
  "nameAr": "د. سارة ميتشل",
  "specialty": "Cardiology",
  "specialtyAr": "أمراض القلب",
  "status": "active",
  "rating": 4.9,
  "experience": 15
}
```

Slots endpoint can stay simple:

```json
{
  "doctorId": "staff-1",
  "date": "2026-04-12",
  "slots": [
    { "time": "09:00", "available": true },
    { "time": "09:30", "available": true },
    { "time": "10:00", "available": false }
  ]
}
```

### Frontend Integration Notes

- The chatbot currently assumes doctor IDs match staff IDs.
- The chatbot currently uses tomorrow's date plus a selected slot when creating a mock booking.
- When backend is wired in, the safest replacement path is:
  - replace local doctor/specialty reads with API reads
  - replace local slot generation with real availability API
  - replace local `addAppointment(...)` call with `POST /appointments`
  - optionally replace rule-based replies with backend chatbot responses
- If backend adds a real chat endpoint later, the frontend can still keep:
  - language selection in UI
  - auth gate in UI
  - quick replies in UI
  - message persistence locally or via backend thread IDs

### What the Backend Dev Should Not Assume

- Current chatbot text is not backed by LLM or server logic yet.
- Current quick replies are UI-driven and derived from local doctor data.
- Current authentication is mock Zustand state, not cookies or tokens yet.
- Current unread counts are just counts of local clinic-side messages in browser storage.

## Known Frontend Gaps the Backend Dev Should Know

1. There is no dedicated patient profile entity yet in the frontend model.
2. Signup users are currently browser-local only.
3. Appointment records currently duplicate display fields like `patientName`, `doctorName`, and `specialty`.
4. Payment method exists only in UI flow right now, not in the shared `Appointment` TypeScript type.
5. Auth and staff are partially split:
   - auth user handles login/role
   - staff handles doctor/reception operational profile data
6. Arabic text exists in the UI, so backend should support bilingual fields where needed for names/specialties.

## Recommended Backend Priorities

1. Implement auth endpoints first
2. Implement doctor/staff listing
3. Implement appointments CRUD with doctor and patient filters
4. Add payment metadata to appointment responses
5. Add patient profile entity if needed for growth

## Short Summary for Backend Dev

The frontend is already built around:

- role-based authentication
- staff-based doctor records
- appointment records linked by `patientId` and `doctorId`
- dashboard filtering by logged-in user role and ID

The safest backend path is:

- keep role-based users
- keep doctors as staff records
- keep appointments as the central entity
- ensure doctor IDs in auth and appointments stay aligned with staff IDs
