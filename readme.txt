Excellent — you’ve got a solid and visionary concept here. You’ve described a **Smart Ambulance Management Platform (RESCULANCE)** with deep relational logic between multiple entities (Hospitals, Fleet Owners, Ambulances, Doctors, Paramedics, Patients, and the Superadmin).

Let’s now formalize this into a **Professional Software Requirement Specification (SRS) Document** that your developers and designers can directly use.
I’ll also include **improvement suggestions** inline where they can strengthen functionality, maintainability, or user experience.

---

## 📘 RESCULANCE – Smart Ambulance Management Platform

**Version 1.0**
**Prepared by:** Product & Engineering Team
**Date:** October 2025

---

### 1. Project Overview

**Project Name:** RESCULANCE (Smart Ambulance Platform)
**Objective:** To create an intelligent, data-integrated ambulance management system that connects hospitals, fleet owners, doctors, and paramedics through a centralized platform for efficient patient handling and real-time monitoring.

The system aims to:

* Digitally manage ambulance operations and staff assignments.
* Integrate IoT/smart medical devices in ambulances for real-time monitoring.
* Enable collaboration between hospitals and fleet owners.
* Ensure controlled access, traceability, and data segregation across organizations.

---

### 2. User Types & Roles

| User Type                | Belongs To   | Description                                                                |
| ------------------------ | ------------ | -------------------------------------------------------------------------- |
| **Superadmin**           | System Level | Controls the entire platform, manages onboarding and approvals.            |
| **Hospital Admin**       | Hospital     | Manages hospital’s staff, ambulances, doctors, paramedics.                 |
| **Hospital Staff**       | Hospital     | Operates ambulances, patients, and mappings (except staff management).     |
| **Doctor (Hospital)**    | Hospital     | Treats patients onboarded to ambulances.                                   |
| **Paramedic (Hospital)** | Hospital     | Onboards patients, manages ambulance dashboards, coordinates with doctors. |
| **Fleet Admin**          | Fleet Owner  | Manages ambulances, staff, doctors, and paramedics in fleet organization.  |
| **Fleet Staff**          | Fleet Owner  | Operates similar to hospital staff (no staff management).                  |
| **Doctor (Fleet)**       | Fleet Owner  | Performs the same functions as hospital doctors.                           |
| **Paramedic (Fleet)**    | Fleet Owner  | Same as hospital paramedics but within fleet context.                      |

---

### 3. Organisation Structures

#### A. **Hospitals**

* Created by **Superadmin**.
* Identified by **unique Hospital Code**.
* Can own ambulances or collaborate with Fleet Owners to use theirs.

#### B. **Fleet Owners**

* Created by **Superadmin**.
* Identified by **unique Fleet Owner Code**.
* Can provide ambulances to multiple hospitals but each ambulance can only serve **one hospital at a time**.

---

### 4. Functional Requirements

#### 4.1. Superadmin Features

1. Create and manage **Hospital** and **Fleet Owner** organizations.
2. Approve:

   * New **ambulances** before activation.
   * New **staff accounts** (admins, staff).
3. View and manage all ambulances, users, and patients globally.
4. Monitor overall system metrics, performance, and device integrations.
5. Suspend or delete hospitals, fleets, or ambulances.

---

#### 4.2. Hospital Features

##### Admin:

1. **User Management**

   * Create Staff, Doctors, Paramedics.
   * Manage access, reset credentials.
2. **Ambulance Management**

   * Create and fill ambulance details (with smart device IDs, registration, etc.).
   * Submit for Superadmin approval.
   * Map doctors/paramedics to ambulances.
3. **Patient Onboarding**

   * Onboard patients to ambulances (can select from owned or connected ambulances).
   * Once onboarded → ambulance dashboard activates for doctor/paramedic.
4. **Ambulance Dashboard**

   * Real-time data from devices (vitals, GPS, etc.).
   * Communication: text, call, or video (doctor–paramedic).
   * Offboard patient → store complete treatment session in hospital’s **Patient Table**.
5. **Data Access Controls**

   * Hide patient data selectively from doctors/paramedics.
   * Patient data accessible only by code and if not restricted.
6. **Request Ambulance from Fleet Owner**

   * Enter ambulance code + fleet owner code.
   * Send collaboration request.
   * Use ambulance if request accepted and ambulance is active.

##### Staff:

* Same as Admin **except staff management**.

##### Doctors:

* Can view and access ambulance dashboards **only if a patient is onboarded**.
* Can view ambulance profiles for mapped ambulances.
* Can access patient data via code (if not hidden).

##### Paramedics:

* Can access ambulance dashboards **for all mapped ambulances anytime**.
* Can onboard patients.
* Can access previous patient data via code.

---

#### 4.3. Fleet Owner Features

##### Fleet Admin:

1. **User Management**

   * Create Staff, Doctors, Paramedics.
2. **Ambulance Management**

   * Add ambulances with smart device IDs, details.
   * Provide ambulance codes to hospitals for collaboration.
3. **Request Handling**

   * Accept/reject hospital collaboration requests.
4. **Operational Control**

   * Mark ambulance active, inactive, or en route.
   * Lock ambulance to specific hospital during use.
5. **Patient Offboarding**

   * Store summarized patient data post offboarding.

##### Fleet Staff:

* Similar to hospital staff (excluding staff management).

##### Fleet Doctors & Paramedics:

* Function identical to their hospital counterparts, but only within fleet-linked ambulances.

---

### 5. Ambulance Lifecycle

| Stage                  | Description                                                  |
| ---------------------- | ------------------------------------------------------------ |
| **Created**            | Added by Hospital/Fleet; awaiting Superadmin approval.       |
| **Active**             | Approved by Superadmin; ready for assignments.               |
| **Mapped**             | Linked to doctors/paramedics.                                |
| **Patient Onboarded**  | In mission mode; dashboard active.                           |
| **En Route**           | Currently being used by a hospital; not available to others. |
| **Patient Offboarded** | Session data saved, ready for next assignment.               |

---

### 6. Data Entities (Simplified ER Model Overview)

* **Organizations**

  * Hospital
  * Fleet Owner

* **Users**

  * Linked to one organization
  * Have role-based access levels

* **Ambulances**

  * One-to-many relationship with Organizations
  * Many-to-many mapping with Doctors/Paramedics
  * One-to-many relationship with Patients (per session)

* **Patients**

  * Contain session data, vitals, chat logs, treatment notes, device data, etc.
  * Linked to hospital and optionally to fleet owner

* **Devices**

  * Each ambulance can have multiple device IDs; data fetched via APIs

---

### 7. Access Control Summary

| Role               | Create Staff | Create Ambulance | Map Users | Approve Requests | Onboard Patient | View Dashboard | Manage Data Visibility |
| ------------------ | ------------ | ---------------- | --------- | ---------------- | --------------- | -------------- | ---------------------- |
| Superadmin         | ✅            | ✅                | ✅         | ✅                | ✅               | ✅              | ✅                      |
| Hospital Admin     | ✅            | ✅                | ✅         | ❌                | ✅               | ✅              | ✅                      |
| Hospital Staff     | ❌            | ✅                | ✅         | ❌                | ✅               | ✅              | ✅                      |
| Hospital Doctor    | ❌            | ❌                | ❌         | ❌                | ❌               | Conditional    | ✅ (limited)            |
| Hospital Paramedic | ❌            | ❌                | ❌         | ❌                | ✅               | ✅              | ❌                      |
| Fleet Admin        | ✅            | ✅                | ✅         | ✅                | ✅               | ✅              | ✅                      |
| Fleet Staff        | ❌            | ✅                | ✅         | ✅                | ✅               | ✅              | ✅                      |
| Fleet Doctor       | ❌            | ❌                | ❌         | ❌                | ❌               | Conditional    | ❌                      |
| Fleet Paramedic    | ❌            | ❌                | ❌         | ❌                | ✅               | ✅              | ❌                      |

---

### 8. Improvement Suggestions 🔧

1. **Modular Microservice Architecture:**
   Separate major entities (Users, Ambulances, Patients, Devices) into independent services for scalability.

2. **Unified Role-Based Access Control (RBAC):**
   Implement a central access control layer (e.g., via JWT roles) for future extensibility.

3. **Realtime Data Streaming (for Dashboard):**
   Use **WebSockets (Socket.io)** or **Firebase Realtime DB** for live updates from ambulances.

4. **Audit Logging:**
   Maintain a full activity log for patient safety and legal accountability (who accessed what data, when).

5. **Offline-first Mobile App:**
   Paramedics should be able to operate the app even in low-network areas; data syncs automatically later.

6. **Analytics Module:**
   Dashboards for hospital/fleet admins: number of trips, patient types, response times, etc.

7. **Security & Privacy:**
   Use end-to-end encryption for medical data; compliance with HIPAA-equivalent standards (if international).

8. **Emergency Mode:**
   Allow hospitals to raise emergency signals visible to nearby fleet owners with available ambulances.

