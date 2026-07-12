# AssetFlow ERP

AssetFlow is a modern, enterprise-grade SaaS Asset Management ERP system designed to help organizations govern hardware inventory, track employee custody allocations, manage maintenance schedules, request transfers, book shared spaces, and generate compliance audits.

Built with a premium design system inspired by Stripe, Vercel, Linear, and Notion, the application is fully responsive, dynamic, and integrated with role-based access control (RBAC).

---

## 🚀 Key Features

- **Comprehensive Dashboard**: Beautiful cards displaying key metrics (active assets, utilization rates, pending maintenance tickets, etc.), recent notifications, and visual breakdown charts of assets by category.
- **Dynamic Asset Directory**: Manage assets across categories (Computing, Furniture, Vehicles, Shared Spaces) with status tracking (`Available`, `Allocated`, `Reserved`, `Under Maintenance`, `Retired`, `Disposed`), custom parameters, and action logs.
- **Custody & Transfers**: Assign assets to employees or departments with specified return dates, track overdue items, and process custody transfers between employees.
- **Maintenance & Repairs Ledger**: Report equipment failures, assign technicians, log repair descriptions, update asset conditions, and close tickets.
- **Resource Bookings**: Book shared resources (e.g. conference rooms) with conflict checks.
- **Auditing & Compliance**: Schedule compliance audits, verify inventory condition status (`Verified`, `Missing`, `Damaged`), and view organization logs.
- **Role-Based Access Control (RBAC)**: Fine-grained user actions governed by roles (`System Admin`, `Organization Admin`, `Asset Manager`, `Department Head`, `Employee`).
- **Live Notifications Panel**: Interactive bell dropdown displaying real-time system alerts.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Notifications**: Sonner

### Backend
- **Server**: Node.js, Express, TypeScript
- **Database**: PostgreSQL (Hosted on Neon) or fallback local JSON database
- **Dev Server**: Nodemon + ts-node

---

## 📁 Repository Structure

```
├── frontend/               # React + Vite frontend application
│   ├── src/
│   │   ├── app/            # App routes and configuration
│   │   ├── components/     # Reusable UI components (Dialog, Drawer, Button, Table, etc.)
│   │   ├── contexts/       # Global State contexts (Auth, Theme)
│   │   ├── features/       # Feature modules (Dashboard)
│   │   ├── layouts/        # Layout wrappers (DashboardLayout)
│   │   ├── pages/          # Main application pages
│   │   ├── services/       # Frontend API endpoints communication
│   │   └── types/          # TypeScript interfaces (Asset, User, Allocation)
│   ├── vite.config.ts      # Vite server configuration (locked on port 5174)
│   └── package.json
│
├── backend/                # Express backend application
│   ├── src/
│   │   ├── db.ts           # Neon PostgreSQL connection & initialization logic
│   │   ├── server.ts       # Express API routes & handlers
│   │   └── types/          # Shared server type definitions
│   ├── run_reset.ts        # Database migration & seed utility
│   ├── database.json       # Local fallback database when DATABASE_URL is empty
│   └── package.json
```

---

## ⚙️ Setup & Configuration

Both `frontend/` and `backend/` require local configuration via `.env` files.

### 1. Backend Configuration
Create `backend/.env`:
```env
PORT=5000
DATABASE_FILE=database.json
DATABASE_URL=postgresql://neondb_owner:npg_OGivpfYM21WN@ep-little-truth-aodp6zhz-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### 2. Frontend Configuration
Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🏃 Running the Application

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### Step 1: Install Dependencies
Run npm install in both directories:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Seed & Reset the Database (Neon Postgres)
To reset the Neon database schemas and upload the pristine 80-asset seed list:
```bash
cd backend
npx ts-node run_reset.ts
```

### Step 3: Run the Servers
Start both servers concurrently:

**Start Backend Dev Server:**
```bash
cd backend
npm run dev
# Server runs on port 5000 (API endpoints at http://localhost:5000/api)
```

**Start Frontend Dev Server:**
```bash
cd frontend
npm run dev
# Application runs on port 5174 (Access at http://localhost:5174/)
```

---

## 🔑 Login Credentials

The database contains seeded test users with predefined roles for testing and grading:

| Email | Password | Role | Description |
| :--- | :--- | :--- | :--- |
| **admin@assetflow.com** | `admin123` | **System Admin** | Full read/write access to all modules |
| **manager@assetflow.com** | `manager123` | **Asset Manager** | Allocates assets, handles maintenance, and creates audits |
| **depthead@assetflow.com** | `depthead123` | **Department Head** | Can request/approve custody transfers and book rooms |
| **employee@assetflow.com** | `employee123` | **Employee** | Can create resource bookings and raise tickets |
