# SusaLabs Car Repair Shop Management App

Welcome to the **Car Repair Shop Management** application. This project is designed to handle the end-to-end operations of a vehicle repair shop, including job cards, mechanic assignments, spare part inventory, and accounting.

## 🚀 Project Overview

The project is structured as a monorepo consisting of three main modules:

1. **`server/`** ➡️ **Backend API** (Node.js, Express, MongoDB)
2. **`reparingShop/`** ➡️ **Web Dashboard** (React 19, Vite, Tailwind CSS, Ant Design)
3. **`Repairshop/`** ➡️ **Mobile Application** (React Native)

---

## 🏗️ Architecture & Flow Logic

### 1. Backend (`server/`)
The backend provides REST APIs for all client applications. It is built using **Node.js, Express.js, and Mongoose**.
- **Key Models**: 
  - `User.js` (Handles Admins, Managers, Accountants, Store Keepers, etc.)
  - `Job.js` (Core entity for managing vehicle repair jobs and statuses)
  - `Part.js` (Inventory management for the store)
  - `Mechanic.js` (Mechanic profiles and availability)
- **Features**: Authentication (JWT & bcrypt), Image Uploads (Cloudinary + Multer), Excel/PDF Generation.

### 2. Web Dashboard (`reparingShop/`)
The frontend portal is used by the internal staff to manage operations. It uses role-based access control with different views for:
- **Admin**: Full control over users, overall metrics, and settings.
- **Manager**: Creates and tracks `Jobs`, assigns `Mechanics`, and oversees day-to-day operations.
- **Store**: Manages `Parts` inventory, handles parts requisition for jobs.
- **Accountant**: Handles billing, invoices, and financial reporting.

*Tech stack*: React 19, Vite, React Router, Zustand (State Management), Tailwind CSS, Ant Design.

### 3. Mobile App (`Repairshop/`)
A cross-platform mobile application built with **React Native**. It is intended for field use (e.g., Mechanics logging job progress, uploading images, or quick access for managers).
- *Tech stack*: React Native CLI, React Navigation, Zustand, Axios, React Native Image Picker.

---

## 🛠️ Getting Started (Local Development)

### Prerequisites
- Node.js (>= 18.x recommended, React Native requires Engine >= 22.11.0 based on `package.json`)
- MongoDB (Local or Atlas URI)
- Ruby/CocoaPods (For iOS development)
- Android Studio / Xcode

### 1️⃣ Setup the Backend API
```bash
cd server
npm install
# Create a .env file based on .env.example (Add MongoDB URI, JWT Secret, Cloudinary keys)
npm run dev
```

### 2️⃣ Setup the Web Dashboard
```bash
cd reparingShop
npm install
npm run dev
# The app will start on Vite's default port (usually http://localhost:5173)
```

### 3️⃣ Setup the Mobile App
```bash
cd Repairshop
npm install
# For iOS:
cd ios && pod install && cd ..
npm run ios

# For Android:
npm run android
```

---

## � Test Credentials (For Local Development)

You can use the following test accounts to explore the application with different roles:

| Role       | Email                | Password | Permissions & Access |
|------------|----------------------|----------|----------------------|
| **Admin**  | admin@gmail.com      | 12345678 | Full system control. Can view all metrics, manage Users/Mechanics, generate final invoices, and access all settings. |
| **Manager**| manager@gmail.com    | 12345678 | Core operational control. Creates Jobs, assigns Mechanics, adds repair costs/faults, and manages Customer Approvals. Cannot access System Users. |
| **Store**  | store@gmail.com      | 12345678 | Inventory control. Uploads spare parts (Excel import support), manages stock levels, and fulfills part requests for ongoing jobs. |
| **Accountant**| accountant@gmail.com | 12345678 | Financial control. Can only view Completed Jobs, generate official PDF invoices, and monitor financial dashboards. No operational edit access. |
| **Mechanic**| mechanic@gmail.com   | 12345678 | Field usage (Mobile App). Views assigned jobs, fills out 7-point Inspection Checklists, reports faulty parts, and updates job status to Complete. |
| **Driver** | driver@gmail.com     | 12345678 | Field usage (Mobile App). Logs pickup/drop-off status for customer vehicles. |

---

## �📜 Key Commands Summary
- `npm run seed` (in `server/`): Seeds the database with initial required data.
- `npm run build` (in `reparingShop/`): Builds the frontend for production.
- `npm run lint` (available in web and mobile app): Runs ESLint for code formatting.

## 🤝 Contribution Guidelines
When contributing to this project:
1. Ensure you work in the appropriate module directory.
2. Follow the existing folder structures (Controllers/Services/Models for backend, feature-based folders for frontend).
3. Do not commit sensitive keys to source control (always use `.env`).
4. Format your code using the provided Prettier/ESLint configs before opening a Pull Request.
