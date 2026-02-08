# Appendix 11: System Codes

This appendix contains the core source code for the Sto. Niño Elementary School Management System. Each section represents a critical component of the application's architecture.

The full repository can be accessed at: [https://github.com/Golgrax/cuddly-computing-machine](https://github.com/Golgrax/cuddly-computing-machine)

---

### 1. Backend Server & API Configuration
**File:** `system/backend/server.js`  
**Purpose:** Handles the Node.js server initialization, middleware, file upload (Multer) logic, and email transporter configuration.  
**Key Logic Starts at:** [Line 1](https://github.com/Golgrax/cuddly-computing-machine/blob/main/system/backend/server.js#L1)

### 2. Database Schema & Persistence Layer
**File:** `system/backend/database.js`  
**Purpose:** Defines the SQLite database structure, including tables for users, grades, attendance, and activity logs.  
**Key Logic Starts at:** [Line 26](https://github.com/Golgrax/cuddly-computing-machine/blob/main/system/backend/database.js#L26) (Table Initialization)

### 3. Academic Grading & SF9 Generation
**File:** `system/pages/Grades.tsx`  
**Purpose:** The core logic for calculating averages, handling faculty grade entries, and triggering the SF9 (Report Card) Excel generation.  
**Key Logic Starts at:** [Line 144](https://github.com/Golgrax/cuddly-computing-machine/blob/main/system/pages/Grades.tsx#L144) (Update Logic) and [Line 315](https://github.com/Golgrax/cuddly-computing-machine/blob/main/system/pages/Grades.tsx#L315) (Grading Table)

### 4. Role-Based Authentication Logic
**File:** `system/pages/Login.tsx`  
**Purpose:** Manages secure login, sign-up restrictions, and determines user access levels (Admin vs. Teacher vs. Student).  
**Key Logic Starts at:** [Line 58](https://github.com/Golgrax/cuddly-computing-machine/blob/main/system/pages/Login.tsx#L58) (`handleAction` function)

### 5. Centralized API Service Bridge
**File:** `system/src/api.js`  
**Purpose:** Acts as the communication layer between the React frontend and the backend API endpoints.  
**Key Logic Starts at:** [Line 17](https://github.com/Golgrax/cuddly-computing-machine/blob/main/system/src/api.js#L17) (`api` object definition)

### 6. Application Routing & Security Guard
**File:** `system/App.tsx`  
**Purpose:** The main application entry point that manages global state, themes, and ensures unauthorized users are redirected.  
**Key Logic Starts at:** [Line 315](https://github.com/Golgrax/cuddly-computing-machine/blob/main/system/App.tsx#L315) (System Routes)

---
*Note: Line numbers are approximate based on the current system version. Please refer to the GitHub repository for the most up-to-date source code.*
