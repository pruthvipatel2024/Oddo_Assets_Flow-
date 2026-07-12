import fs from "fs"
import path from "path"
import dotenv from "dotenv"
import { Pool } from "pg"
import crypto from "crypto"

dotenv.config()

const DATABASE_FILE = path.join(process.cwd(), process.env.DATABASE_FILE || "database.json")

export interface Department {
  id: string
  name: string
  parentId?: string
  managerId?: string
  status: "active" | "inactive"
}

export interface CategoryField {
  name: string
  type: "text" | "number" | "boolean"
  required: boolean
}

export interface AssetCategory {
  id: string
  name: string
  parentId?: string
  fields: CategoryField[]
}

// Unified User model replacing Employee
export interface User {
  id: string
  employeeCode?: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone?: string
  passwordHash: string
  avatar?: string
  departmentId?: string
  designation?: string
  roleId: string
  status: "active" | "inactive" | "suspended"
  lastLogin?: string
  createdAt: string
  updatedAt: string
}

export interface Permission {
  id: string
  name: string
  description?: string
}

export interface Role {
  id: string
  name: string
  permissions: string[]
}

export interface Asset {
  tag: string
  name: string
  categoryId: string
  serialNumber: string
  acquisitionDate: string
  acquisitionCost: number
  condition: "new" | "good" | "fair" | "poor"
  location: string
  sharedFlag: boolean
  status: "Available" | "Allocated" | "Reserved" | "Under Maintenance" | "Lost" | "Retired" | "Disposed"
  customFields: Record<string, any>
  assignedToUserId?: string
}

export interface AssetAllocation {
  id: string
  assetTag: string
  userId?: string
  departmentId?: string
  allocatedAt: string
  expectedReturnDate?: string
  returnedAt?: string
  returnConditionNotes?: string
  status: "active" | "returned"
}

export interface TransferRequest {
  id: string
  assetTag: string
  fromUserId?: string
  toUserId: string
  departmentId?: string
  status: "Pending" | "Approved" | "Rejected"
  requestedAt: string
  requestedByUserId: string
  approvedByUserId?: string
}

export interface ResourceBooking {
  id: string
  assetTag: string
  bookedByUserId: string
  departmentId?: string
  startTime: string
  endTime: string
  status: "Upcoming" | "Ongoing" | "Completed" | "Cancelled"
  notes?: string
}

export interface MaintenanceRequest {
  id: string
  assetTag: string
  requestedByUserId: string
  approvedByUserId?: string
  technicianUserId?: string
  description: string
  priority: "low" | "medium" | "high"
  status: "Pending" | "Approved" | "Rejected" | "In Progress" | "Resolved"
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface AuditCycle {
  id: string
  name: string
  scopeDepartmentId?: string
  scopeLocation?: string
  startDate: string
  endDate: string
  assignedAuditorUserId: string
  createdByUserId: string
  status: "Active" | "Closed"
  results: Record<string, "Verified" | "Missing" | "Damaged">
  notes?: string
}

export interface ActivityLog {
  id: string
  userId: string
  userName: string
  userRole: string
  action: string
  entity: string
  entityId: string
  previousValue: string
  newValue: string
  timestamp: string
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: "general" | "maintenance" | "audit" | "approval"
  read: boolean
  timestamp: string
}

export interface DatabaseCollections {
  departments: Department[]
  categories: AssetCategory[]
  roles: Role[]
  users: User[]
  assets: Asset[]
  allocations: AssetAllocation[]
  transfers: TransferRequest[]
  bookings: ResourceBooking[]
  maintenance: MaintenanceRequest[]
  audits: AuditCycle[]
  logs: ActivityLog[]
  notifications: Notification[]
}

// Helpers for cryptography
export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex")
}

const DEPARTMENTS_SEED: Department[] = [
  { id: "dept_1", name: "IT Infrastructure", managerId: "usr_admin", status: "active" },
  { id: "dept_2", name: "Facilities & Logistics", managerId: "usr_manager", status: "active" },
  { id: "dept_3", name: "Design & Marketing", managerId: "usr_dept_head", status: "active" },
  { id: "dept_4", name: "Research & Development", managerId: "usr_dept_head", status: "active" },
]

const CATEGORIES_SEED: AssetCategory[] = [
  {
    id: "cat_1",
    name: "Computing",
    fields: [
      { name: "RAM", type: "text", required: true },
      { name: "Processor", type: "text", required: true },
      { name: "Storage", type: "text", required: false },
    ],
  },
  {
    id: "cat_2",
    name: "Furniture",
    fields: [
      { name: "Material", type: "text", required: true },
      { name: "Dimensions", type: "text", required: false },
    ],
  },
  {
    id: "cat_3",
    name: "Vehicles",
    fields: [
      { name: "License Plate", type: "text", required: true },
      { name: "Fuel Type", type: "text", required: true },
      { name: "Last Service Mileage", type: "number", required: false },
    ],
  },
  {
    id: "cat_4",
    name: "Shared Spaces",
    fields: [
      { name: "Capacity", type: "number", required: true },
      { name: "Projector Equipped", type: "boolean", required: true },
    ],
  },
]

const ROLES_SEED: Role[] = [
  {
    id: "sys_admin",
    name: "System Admin",
    permissions: [
      "asset.create", "asset.update", "asset.delete", "asset.allocate", "asset.transfer",
      "booking.create", "booking.approve", "maintenance.approve",
      "audit.create", "audit.close", "report.export", "user.manage", "role.manage", "organization.manage"
    ]
  },
  {
    id: "org_admin",
    name: "Organization Admin",
    permissions: [
      "asset.create", "asset.update", "asset.delete", "asset.allocate", "asset.transfer",
      "booking.create", "booking.approve", "maintenance.approve",
      "audit.create", "audit.close", "report.export", "user.manage", "role.manage", "organization.manage"
    ]
  },
  {
    id: "asset_manager",
    name: "Asset Manager",
    permissions: [
      "asset.create", "asset.update", "asset.delete", "asset.allocate", "asset.transfer",
      "booking.create", "maintenance.approve", "audit.create", "audit.close", "report.export"
    ]
  },
  {
    id: "dept_head",
    name: "Department Head",
    permissions: [
      "asset.transfer", "booking.create", "booking.approve", "report.export"
    ]
  },
  {
    id: "employee",
    name: "Employee",
    permissions: [
      "booking.create"
    ]
  }
]

const USERS_SEED: User[] = [
  {
    id: "usr_admin",
    employeeCode: "AF-ADM-01",
    firstName: "Sarah",
    lastName: "Connor",
    fullName: "Sarah Connor",
    email: "admin@assetflow.com",
    phone: "1-800-555-0199",
    passwordHash: hashPassword("admin123"),
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Sarah",
    departmentId: "dept_1",
    designation: "Chief IT Architect",
    roleId: "sys_admin",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "usr_manager",
    employeeCode: "AF-MGR-02",
    firstName: "Alex",
    lastName: "Mercer",
    fullName: "Alex Mercer",
    email: "manager@assetflow.com",
    phone: "1-800-555-0245",
    passwordHash: hashPassword("manager123"),
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Alex",
    departmentId: "dept_2",
    designation: "Asset Operations Lead",
    roleId: "asset_manager",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "usr_employee",
    employeeCode: "AF-EMP-03",
    firstName: "Bruce",
    lastName: "Wayne",
    fullName: "Bruce Wayne",
    email: "employee@assetflow.com",
    phone: "1-800-555-1939",
    passwordHash: hashPassword("employee123"),
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Bruce",
    departmentId: "dept_4",
    designation: "Head of Applied Sciences",
    roleId: "employee",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "usr_dept_head",
    employeeCode: "AF-HED-04",
    firstName: "Clark",
    lastName: "Kent",
    fullName: "Clark Kent",
    email: "depthead@assetflow.com",
    phone: "1-800-555-1938",
    passwordHash: hashPassword("depthead123"),
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Clark",
    departmentId: "dept_3",
    designation: "Creative Director",
    roleId: "dept_head",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const ASSETS_SEED: Asset[] = [
  // --- Category 1: Computing (cat_1) ---
  {
    tag: "AF-0001",
    name: "MacBook Pro M3",
    categoryId: "cat_1",
    serialNumber: "MBP39482934",
    acquisitionDate: "2026-01-15",
    acquisitionCost: 195000,
    condition: "new",
    location: "IT Storage Room A",
    sharedFlag: false,
    status: "Available",
    customFields: { RAM: "16GB", Processor: "M3 Pro", Storage: "512GB SSD" },
  },
  {
    tag: "AF-0002",
    name: "Dell XPS 15",
    categoryId: "cat_1",
    serialNumber: "DXPS938472",
    acquisitionDate: "2025-06-10",
    acquisitionCost: 165000,
    condition: "good",
    location: "IT Storage Room A",
    sharedFlag: false,
    status: "Allocated",
    customFields: { RAM: "32GB", Processor: "Intel i7", Storage: "1TB SSD" },
    assignedToUserId: "usr_employee",
  },
  {
    tag: "AF-0003",
    name: "Lenovo ThinkPad X1 Carbon",
    categoryId: "cat_1",
    serialNumber: "TPX1-88371",
    acquisitionDate: "2025-09-12",
    acquisitionCost: 145000,
    condition: "new",
    location: "HQ Wing C Floor 2",
    sharedFlag: false,
    status: "Available",
    customFields: { RAM: "16GB", Processor: "Intel Ultra 7", Storage: "512GB SSD" },
  },
  {
    tag: "AF-0004",
    name: "Zebra Barcode Scanner",
    categoryId: "cat_1",
    serialNumber: "ZEB-93847-X",
    acquisitionDate: "2024-03-05",
    acquisitionCost: 18000,
    condition: "fair",
    location: "Main Logistics Hub",
    sharedFlag: false,
    status: "Under Maintenance",
    customFields: { RAM: "N/A", Processor: "ARM Cortex", Storage: "128MB Flash" },
  },
  {
    tag: "AF-0005",
    name: "HP EliteBook 840",
    categoryId: "cat_1",
    serialNumber: "HP-EB-8402",
    acquisitionDate: "2025-10-10",
    acquisitionCost: 95000,
    condition: "good",
    location: "IT Storage Room A",
    sharedFlag: false,
    status: "Available",
    customFields: { RAM: "16GB", Processor: "Intel i5", Storage: "256GB SSD" },
  },
  {
    tag: "AF-0006",
    name: "Apple iMac 24-inch",
    categoryId: "cat_1",
    serialNumber: "MAC-IMAC-24",
    acquisitionDate: "2024-11-20",
    acquisitionCost: 125000,
    condition: "good",
    location: "Design Studio Floor 2",
    sharedFlag: false,
    status: "Available",
    customFields: { RAM: "8GB", Processor: "M3", Storage: "256GB SSD" },
  },
  {
    tag: "AF-0007",
    name: "ASUS ROG Zephyrus G14",
    categoryId: "cat_1",
    serialNumber: "ROG-G14-998",
    acquisitionDate: "2026-02-05",
    acquisitionCost: 140000,
    condition: "new",
    location: "R&D Lab Floor 3",
    sharedFlag: false,
    status: "Available",
    customFields: { RAM: "32GB", Processor: "Ryzen 9", Storage: "1TB SSD" },
  },
  {
    tag: "AF-0008",
    name: "iPad Pro 12.9",
    categoryId: "cat_1",
    serialNumber: "IPAD-PRO-129",
    acquisitionDate: "2025-04-18",
    acquisitionCost: 85000,
    condition: "new",
    location: "Executive Office Suite",
    sharedFlag: true,
    status: "Available",
    customFields: { RAM: "8GB", Processor: "M2", Storage: "128GB Flash" },
  },
  {
    tag: "AF-0009",
    name: "Microsoft Surface Pro 9",
    categoryId: "cat_1",
    serialNumber: "MS-SURF-P9",
    acquisitionDate: "2025-07-22",
    acquisitionCost: 110000,
    condition: "good",
    location: "Sales Department C",
    sharedFlag: false,
    status: "Available",
    customFields: { RAM: "16GB", Processor: "Intel i7", Storage: "256GB SSD" },
  },
  {
    tag: "AF-0010",
    name: "Lenovo Legion 5 Pro",
    categoryId: "cat_1",
    serialNumber: "LEGION-5P-77",
    acquisitionDate: "2025-12-01",
    acquisitionCost: 115000,
    condition: "new",
    location: "R&D Lab Floor 3",
    sharedFlag: false,
    status: "Available",
    customFields: { RAM: "16GB", Processor: "Ryzen 7", Storage: "512GB SSD" },
  },

  // --- Category 2: Furniture (cat_2) ---
  {
    tag: "AF-0011",
    name: "Ergonomic Desk Chair",
    categoryId: "cat_2",
    serialNumber: "CH-ERGO-091",
    acquisitionDate: "2025-11-20",
    acquisitionCost: 18000,
    condition: "good",
    location: "Design Studio Floor 2",
    sharedFlag: false,
    status: "Available",
    customFields: { Material: "Mesh & Steel", Dimensions: "24x24x45 inches" },
  },
  {
    tag: "AF-0012",
    name: "Adjustable Standing Desk",
    categoryId: "cat_2",
    serialNumber: "DSK-STAND-881",
    acquisitionDate: "2025-08-14",
    acquisitionCost: 35000,
    condition: "new",
    location: "HQ Wing C Floor 2",
    sharedFlag: false,
    status: "Available",
    customFields: { Material: "Oak & Iron", Dimensions: "60x30 inches" },
  },
  {
    tag: "AF-0013",
    name: "Conference Room Table",
    categoryId: "cat_2",
    serialNumber: "TBL-CONF-04",
    acquisitionDate: "2024-05-18",
    acquisitionCost: 65000,
    condition: "good",
    location: "HQ Wing A Floor 1",
    sharedFlag: false,
    status: "Available",
    customFields: { Material: "Teak Wood", Dimensions: "120x48 inches" },
  },
  {
    tag: "AF-0014",
    name: "Executive Leather Chair",
    categoryId: "cat_2",
    serialNumber: "CH-EXEC-11",
    acquisitionDate: "2025-02-10",
    acquisitionCost: 28000,
    condition: "good",
    location: "Executive Office Suite",
    sharedFlag: false,
    status: "Available",
    customFields: { Material: "Leather & Mahogany", Dimensions: "28x28x50 inches" },
  },
  {
    tag: "AF-0015",
    name: "Steel Filing Cabinet",
    categoryId: "cat_2",
    serialNumber: "CAB-STEEL-99",
    acquisitionDate: "2023-11-05",
    acquisitionCost: 12000,
    condition: "fair",
    location: "Finance Operations Office",
    sharedFlag: false,
    status: "Available",
    customFields: { Material: "Steel", Dimensions: "18x24x54 inches" },
  },
  {
    tag: "AF-0016",
    name: "Modular Sofa 3-Seater",
    categoryId: "cat_2",
    serialNumber: "SOF-MOD-03",
    acquisitionDate: "2025-01-20",
    acquisitionCost: 45000,
    condition: "good",
    location: "HQ Wing A Lobby",
    sharedFlag: false,
    status: "Available",
    customFields: { Material: "Fabric & Pine", Dimensions: "84x34 inches" },
  },
  {
    tag: "AF-0017",
    name: "Reception Counter Desk",
    categoryId: "cat_2",
    serialNumber: "DSK-RECP-01",
    acquisitionDate: "2024-06-30",
    acquisitionCost: 42000,
    condition: "good",
    location: "HQ Ground Lobby",
    sharedFlag: false,
    status: "Available",
    customFields: { Material: "Marble & Ply", Dimensions: "72x30x42 inches" },
  },
  {
    tag: "AF-0018",
    name: "Canteen Dining Table",
    categoryId: "cat_2",
    serialNumber: "TBL-DINE-08",
    acquisitionDate: "2024-09-15",
    acquisitionCost: 15000,
    condition: "good",
    location: "HQ Cafeteria",
    sharedFlag: false,
    status: "Available",
    customFields: { Material: "Polymer & Stainless Steel", Dimensions: "48x48 inches" },
  },
  {
    tag: "AF-0019",
    name: "Heavy Duty Lab Stool",
    categoryId: "cat_2",
    serialNumber: "STL-LAB-44",
    acquisitionDate: "2025-03-22",
    acquisitionCost: 6500,
    condition: "good",
    location: "R&D Lab Floor 3",
    sharedFlag: false,
    status: "Available",
    customFields: { Material: "Polyurethane & Chrome", Dimensions: "16x16x30 inches" },
  },
  {
    tag: "AF-0020",
    name: "Display Presentation Board",
    categoryId: "cat_2",
    serialNumber: "BRD-DISP-02",
    acquisitionDate: "2025-07-08",
    acquisitionCost: 9500,
    condition: "new",
    location: "HQ Wing B Floor 1",
    sharedFlag: true,
    status: "Available",
    customFields: { Material: "Magnetic Porcelain", Dimensions: "72x48 inches" },
  },

  // --- Category 3: Vehicles (cat_3) ---
  {
    tag: "AF-0021",
    name: "Company Shuttle Van",
    categoryId: "cat_3",
    serialNumber: "VAN-SHUTTLE-88",
    acquisitionDate: "2023-08-12",
    acquisitionCost: 1850000,
    condition: "good",
    location: "Logistics Vehicle Depot B",
    sharedFlag: true,
    status: "Available",
    customFields: { "License Plate": "DL-1C-A-8822", "Fuel Type": "Diesel", "Last Service Mileage": 45000 },
  },
  {
    tag: "AF-0022",
    name: "Executive Sedan - Camry",
    categoryId: "cat_3",
    serialNumber: "CAR-CAMRY-02",
    acquisitionDate: "2025-03-10",
    acquisitionCost: 3200000,
    condition: "new",
    location: "Executive Parking Wing A",
    sharedFlag: false,
    status: "Available",
    customFields: { "License Plate": "MH-02-BY-9911", "Fuel Type": "Petrol", "Last Service Mileage": 5000 },
  },
  {
    tag: "AF-0023",
    name: "Logistics Delivery Truck",
    categoryId: "cat_3",
    serialNumber: "TRK-DELIV-05",
    acquisitionDate: "2024-01-18",
    acquisitionCost: 2400000,
    condition: "good",
    location: "Main Logistics Hub",
    sharedFlag: false,
    status: "Available",
    customFields: { "License Plate": "HR-55-P-4402", "Fuel Type": "Diesel", "Last Service Mileage": 68000 },
  },
  {
    tag: "AF-0024",
    name: "Electric Courier Scooter",
    categoryId: "cat_3",
    serialNumber: "SCT-ELEC-102",
    acquisitionDate: "2025-09-01",
    acquisitionCost: 125000,
    condition: "new",
    location: "Logistics Vehicle Depot B",
    sharedFlag: true,
    status: "Available",
    customFields: { "License Plate": "DL-3S-E-9901", "Fuel Type": "Electric", "Last Service Mileage": 1200 },
  },
  {
    tag: "AF-0025",
    name: "Manager Commuter Sedan",
    categoryId: "cat_3",
    serialNumber: "CAR-SWIFT-09",
    acquisitionDate: "2024-05-15",
    acquisitionCost: 850000,
    condition: "good",
    location: "HQ Staff Parking Floor 1",
    sharedFlag: false,
    status: "Available",
    customFields: { "License Plate": "KA-51-MD-7721", "Fuel Type": "Petrol", "Last Service Mileage": 22000 },
  },
  {
    tag: "AF-0026",
    name: "Material Transport Forklift",
    categoryId: "cat_3",
    serialNumber: "FL-LIFT-948",
    acquisitionDate: "2023-10-22",
    acquisitionCost: 650000,
    condition: "good",
    location: "Logistics Warehouse Floor 1",
    sharedFlag: false,
    status: "Available",
    customFields: { "License Plate": "N/A (Warehouse)", "Fuel Type": "Battery", "Last Service Mileage": 8500 },
  },
  {
    tag: "AF-0027",
    name: "Executive SUV - Fortuner",
    categoryId: "cat_3",
    serialNumber: "CAR-FORT-01",
    acquisitionDate: "2025-07-20",
    acquisitionCost: 4000000,
    condition: "new",
    location: "Executive Parking Wing A",
    sharedFlag: false,
    status: "Available",
    customFields: { "License Plate": "MH-12-TC-8800", "Fuel Type": "Diesel", "Last Service Mileage": 8000 },
  },
  {
    tag: "AF-0028",
    name: "Security Patrol Bike",
    categoryId: "cat_3",
    serialNumber: "BIK-SEC-03",
    acquisitionDate: "2024-11-12",
    acquisitionCost: 180000,
    condition: "good",
    location: "HQ Ground Gate A",
    sharedFlag: false,
    status: "Available",
    customFields: { "License Plate": "MH-14-GH-1234", "Fuel Type": "Petrol", "Last Service Mileage": 15000 },
  },
  {
    tag: "AF-0029",
    name: "Maintenance Utility Van",
    categoryId: "cat_3",
    serialNumber: "VAN-UTIL-04",
    acquisitionDate: "2024-03-08",
    acquisitionCost: 980000,
    condition: "fair",
    location: "Maintenance Yard B",
    sharedFlag: false,
    status: "Available",
    customFields: { "License Plate": "DL-1V-B-5533", "Fuel Type": "CNG", "Last Service Mileage": 38000 },
  },
  {
    tag: "AF-0030",
    name: "Staff Shuttle Bus",
    categoryId: "cat_3",
    serialNumber: "BUS-SHUTTLE-12",
    acquisitionDate: "2023-05-19",
    acquisitionCost: 2800000,
    condition: "good",
    location: "Logistics Vehicle Depot B",
    sharedFlag: true,
    status: "Available",
    customFields: { "License Plate": "MH-04-GP-9988", "Fuel Type": "Diesel", "Last Service Mileage": 78000 },
  },

  // --- Category 4: Shared Spaces (cat_4) ---
  {
    tag: "AF-0031",
    name: "Conference Room B",
    categoryId: "cat_4",
    serialNumber: "SR-ROOM-B",
    acquisitionDate: "2022-05-01",
    acquisitionCost: 0,
    condition: "new",
    location: "HQ Wing C Floor 1",
    sharedFlag: true,
    status: "Available",
    customFields: { Capacity: 12, "Projector Equipped": true },
  },
  {
    tag: "AF-0032",
    name: "Boardroom Suite 1",
    categoryId: "cat_4",
    serialNumber: "BD-ROOM-01",
    acquisitionDate: "2023-01-15",
    acquisitionCost: 0,
    condition: "new",
    location: "HQ Wing A Floor 4",
    sharedFlag: true,
    status: "Available",
    customFields: { Capacity: 24, "Projector Equipped": true },
  },
  {
    tag: "AF-0033",
    name: "Huddle Cabin Room C1",
    categoryId: "cat_4",
    serialNumber: "HD-ROOM-C1",
    acquisitionDate: "2025-06-10",
    acquisitionCost: 0,
    condition: "good",
    location: "HQ Wing C Floor 2",
    sharedFlag: true,
    status: "Available",
    customFields: { Capacity: 4, "Projector Equipped": false },
  },
  {
    tag: "AF-0034",
    name: "Main Auditorium Hall",
    categoryId: "cat_4",
    serialNumber: "AUD-HALL-01",
    acquisitionDate: "2022-08-20",
    acquisitionCost: 0,
    condition: "good",
    location: "HQ Ground Level East",
    sharedFlag: true,
    status: "Available",
    customFields: { Capacity: 150, "Projector Equipped": true },
  },
  {
    tag: "AF-0035",
    name: "Training Center Room B2",
    categoryId: "cat_4",
    serialNumber: "TRN-ROOM-B2",
    acquisitionDate: "2024-03-12",
    acquisitionCost: 0,
    condition: "good",
    location: "HQ Wing B Floor 2",
    sharedFlag: true,
    status: "Available",
    customFields: { Capacity: 30, "Projector Equipped": true },
  },
  {
    tag: "AF-0036",
    name: "R&D Specialized Testing Bay",
    categoryId: "cat_4",
    serialNumber: "RD-BAY-03",
    acquisitionDate: "2025-01-10",
    acquisitionCost: 0,
    condition: "good",
    location: "R&D Lab Floor 3",
    sharedFlag: true,
    status: "Available",
    customFields: { Capacity: 8, "Projector Equipped": false },
  },
  {
    tag: "AF-0037",
    name: "Executive Interview Studio",
    categoryId: "cat_4",
    serialNumber: "INT-STUD-01",
    acquisitionDate: "2025-04-05",
    acquisitionCost: 0,
    condition: "new",
    location: "HQ Wing A Floor 3",
    sharedFlag: true,
    status: "Available",
    customFields: { Capacity: 6, "Projector Equipped": true },
  },
  {
    tag: "AF-0038",
    name: "Brainstorming Lounge B",
    categoryId: "cat_4",
    serialNumber: "LNG-BRNST-B",
    acquisitionDate: "2024-09-08",
    acquisitionCost: 0,
    condition: "good",
    location: "HQ Wing B Floor 3",
    sharedFlag: true,
    status: "Available",
    customFields: { Capacity: 15, "Projector Equipped": false },
  },
  {
    tag: "AF-0039",
    name: "HQ Terrace Dining Deck",
    categoryId: "cat_4",
    serialNumber: "TRC-DECK-01",
    acquisitionDate: "2023-04-18",
    acquisitionCost: 0,
    condition: "good",
    location: "HQ Floor 6 Rooftop",
    sharedFlag: true,
    status: "Available",
    customFields: { Capacity: 40, "Projector Equipped": false },
  },
  {
    tag: "AF-0040",
    name: "Project War Room Room P1",
    categoryId: "cat_4",
    serialNumber: "WAR-ROOM-P1",
    acquisitionDate: "2025-10-01",
    acquisitionCost: 0,
    condition: "new",
    location: "HQ Wing C Floor 3",
    sharedFlag: true,
    status: "Available",
    customFields: { Capacity: 10, "Projector Equipped": true },
  },

  // --- Category 1: Computing (cat_1) — Batch 2 ---
  {
    tag: "AF-0041",
    name: "Dell Latitude 5540",
    categoryId: "cat_1",
    serialNumber: "LAT-5540-01",
    acquisitionDate: "2025-11-08",
    acquisitionCost: 78000,
    condition: "new",
    location: "IT Storage Room B",
    sharedFlag: false,
    status: "Available",
    customFields: { RAM: "16GB", Processor: "Intel i5-1345U", Storage: "512GB SSD" },
  },
  {
    tag: "AF-0042",
    name: "Samsung Galaxy Tab S9",
    categoryId: "cat_1",
    serialNumber: "TAB-S9-118",
    acquisitionDate: "2025-08-20",
    acquisitionCost: 62000,
    condition: "new",
    location: "Sales Department C",
    sharedFlag: true,
    status: "Available",
    customFields: { RAM: "8GB", Processor: "Snapdragon 8 Gen 2", Storage: "128GB Flash" },
  },
  {
    tag: "AF-0043",
    name: "Raspberry Pi 5 Dev Kit",
    categoryId: "cat_1",
    serialNumber: "RPI5-DEV-22",
    acquisitionDate: "2026-01-20",
    acquisitionCost: 8500,
    condition: "new",
    location: "R&D Lab Floor 3",
    sharedFlag: false,
    status: "Available",
    customFields: { RAM: "8GB", Processor: "BCM2712", Storage: "64GB SD" },
  },
  {
    tag: "AF-0044",
    name: "HP LaserJet Pro MFP",
    categoryId: "cat_1",
    serialNumber: "HP-LJ-MFP-44",
    acquisitionDate: "2024-07-15",
    acquisitionCost: 32000,
    condition: "good",
    location: "Admin Print Station Floor 1",
    sharedFlag: true,
    status: "Available",
    customFields: { RAM: "256MB", Processor: "Embedded ARM", Storage: "N/A" },
  },
  {
    tag: "AF-0045",
    name: "Logitech Conference Cam",
    categoryId: "cat_1",
    serialNumber: "CAM-LOGI-321",
    acquisitionDate: "2025-05-10",
    acquisitionCost: 45000,
    condition: "new",
    location: "HQ Wing A Floor 4",
    sharedFlag: true,
    status: "Available",
    customFields: { RAM: "N/A", Processor: "N/A", Storage: "N/A" },
  },
  {
    tag: "AF-0046",
    name: "LG UltraWide 34\" Monitor",
    categoryId: "cat_1",
    serialNumber: "LG-UW34-19",
    acquisitionDate: "2025-09-25",
    acquisitionCost: 38000,
    condition: "new",
    location: "Design Studio Floor 2",
    sharedFlag: false,
    status: "Available",
    customFields: { RAM: "N/A", Processor: "N/A", Storage: "N/A" },
  },
  {
    tag: "AF-0047",
    name: "Synology NAS DS1522+",
    categoryId: "cat_1",
    serialNumber: "NAS-SYN-1522",
    acquisitionDate: "2025-02-12",
    acquisitionCost: 95000,
    condition: "good",
    location: "Server Room B",
    sharedFlag: true,
    status: "Available",
    customFields: { RAM: "8GB ECC", Processor: "Ryzen R1600", Storage: "40TB RAID" },
  },
  {
    tag: "AF-0048",
    name: "Cisco Meraki Wireless AP",
    categoryId: "cat_1",
    serialNumber: "MERAKI-AP-67",
    acquisitionDate: "2024-12-05",
    acquisitionCost: 25000,
    condition: "good",
    location: "HQ Wing C Floor 1",
    sharedFlag: true,
    status: "Available",
    customFields: { RAM: "512MB", Processor: "Embedded MIPS", Storage: "128MB" },
  },
  {
    tag: "AF-0049",
    name: "Apple Mac Mini M2",
    categoryId: "cat_1",
    serialNumber: "MACMINI-M2-08",
    acquisitionDate: "2025-06-18",
    acquisitionCost: 55000,
    condition: "new",
    location: "Creative Lab Floor 2",
    sharedFlag: false,
    status: "Available",
    customFields: { RAM: "8GB", Processor: "M2", Storage: "256GB SSD" },
  },
  {
    tag: "AF-0050",
    name: "ThinkCentre M90q Tiny",
    categoryId: "cat_1",
    serialNumber: "TC-M90Q-33",
    acquisitionDate: "2025-10-15",
    acquisitionCost: 62000,
    condition: "new",
    location: "Finance Operations Office",
    sharedFlag: false,
    status: "Available",
    customFields: { RAM: "16GB", Processor: "Intel i5-13500T", Storage: "512GB SSD" },
  },

  // --- Category 2: Furniture (cat_2) — Batch 2 ---
  {
    tag: "AF-0051",
    name: "L-Shaped Manager Desk",
    categoryId: "cat_2",
    serialNumber: "DSK-LSHP-07",
    acquisitionDate: "2025-04-12",
    acquisitionCost: 48000,
    condition: "new",
    location: "HQ Wing A Floor 3",
    sharedFlag: false,
    status: "Available",
    customFields: { Material: "Engineered Wood & Steel", Dimensions: "72x72x30 inches" },
  },
  {
    tag: "AF-0052",
    name: "Visitor Bench 4-Seater",
    categoryId: "cat_2",
    serialNumber: "BNC-VIS-04",
    acquisitionDate: "2024-08-22",
    acquisitionCost: 14000,
    condition: "good",
    location: "HQ Ground Lobby",
    sharedFlag: false,
    status: "Available",
    customFields: { Material: "Cushioned Steel", Dimensions: "72x22x18 inches" },
  },
  {
    tag: "AF-0053",
    name: "Open Workstation Pod 6-Seat",
    categoryId: "cat_2",
    serialNumber: "WST-POD-06",
    acquisitionDate: "2025-01-08",
    acquisitionCost: 120000,
    condition: "new",
    location: "HQ Wing B Floor 2",
    sharedFlag: false,
    status: "Available",
    customFields: { Material: "MDF Laminate & Aluminium", Dimensions: "180x120 inches" },
  },
  {
    tag: "AF-0054",
    name: "Server Room Equipment Rack",
    categoryId: "cat_2",
    serialNumber: "RACK-SVR-12",
    acquisitionDate: "2024-02-18",
    acquisitionCost: 22000,
    condition: "good",
    location: "Server Room B",
    sharedFlag: false,
    status: "Available",
    customFields: { Material: "Cold-Rolled Steel", Dimensions: "24x36x78 inches" },
  },
  {
    tag: "AF-0055",
    name: "Cafeteria Plastic Chair Set (8)",
    categoryId: "cat_2",
    serialNumber: "CHR-CAFE-S8",
    acquisitionDate: "2024-06-10",
    acquisitionCost: 8000,
    condition: "good",
    location: "HQ Cafeteria",
    sharedFlag: false,
    status: "Available",
    customFields: { Material: "Polypropylene", Dimensions: "18x18x33 inches each" },
  },
  {
    tag: "AF-0056",
    name: "Acoustic Privacy Phone Pod",
    categoryId: "cat_2",
    serialNumber: "POD-PHON-02",
    acquisitionDate: "2025-07-05",
    acquisitionCost: 85000,
    condition: "new",
    location: "HQ Wing C Floor 2",
    sharedFlag: true,
    status: "Available",
    customFields: { Material: "Acoustic Fabric & Aluminium", Dimensions: "42x42x90 inches" },
  },
  {
    tag: "AF-0057",
    name: "Corner Bookshelf Unit",
    categoryId: "cat_2",
    serialNumber: "BKSHF-CNR-05",
    acquisitionDate: "2024-09-22",
    acquisitionCost: 11000,
    condition: "good",
    location: "Training Room Floor 2",
    sharedFlag: false,
    status: "Available",
    customFields: { Material: "Sheesham Wood", Dimensions: "36x12x72 inches" },
  },
  {
    tag: "AF-0058",
    name: "Ergonomic Keyboard Tray",
    categoryId: "cat_2",
    serialNumber: "TRAY-KBD-30",
    acquisitionDate: "2025-03-18",
    acquisitionCost: 3500,
    condition: "new",
    location: "IT Storage Room A",
    sharedFlag: false,
    status: "Available",
    customFields: { Material: "ABS Plastic & Steel Rail", Dimensions: "26x10 inches" },
  },
  {
    tag: "AF-0059",
    name: "Whiteboard Easel Stand",
    categoryId: "cat_2",
    serialNumber: "EASL-WB-11",
    acquisitionDate: "2025-06-28",
    acquisitionCost: 5500,
    condition: "new",
    location: "HQ Wing B Floor 3",
    sharedFlag: true,
    status: "Available",
    customFields: { Material: "Aluminium & Magnetic", Dimensions: "36x24 inches board" },
  },
  {
    tag: "AF-0060",
    name: "Executive Coat Hanger Stand",
    categoryId: "cat_2",
    serialNumber: "HNG-COAT-03",
    acquisitionDate: "2024-04-15",
    acquisitionCost: 4500,
    condition: "good",
    location: "Executive Office Suite",
    sharedFlag: false,
    status: "Available",
    customFields: { Material: "Chrome & Walnut", Dimensions: "18x18x72 inches" },
  },

  // --- Category 3: Vehicles (cat_3) — Batch 2 ---
  {
    tag: "AF-0061",
    name: "CEO Sedan - BMW 5 Series",
    categoryId: "cat_3",
    serialNumber: "BMW-5S-CEO",
    acquisitionDate: "2025-11-15",
    acquisitionCost: 7200000,
    condition: "new",
    location: "Executive Parking Wing A",
    sharedFlag: false,
    status: "Available",
    customFields: { "License Plate": "MH-01-BX-0001", "Fuel Type": "Petrol", "Last Service Mileage": 2000 },
  },
  {
    tag: "AF-0062",
    name: "Staff Pool Hatchback - i20",
    categoryId: "cat_3",
    serialNumber: "CAR-i20-06",
    acquisitionDate: "2024-07-22",
    acquisitionCost: 920000,
    condition: "good",
    location: "HQ Staff Parking Floor 1",
    sharedFlag: true,
    status: "Available",
    customFields: { "License Plate": "MH-12-FG-4521", "Fuel Type": "Petrol", "Last Service Mileage": 35000 },
  },
  {
    tag: "AF-0063",
    name: "Warehouse Pallet Truck",
    categoryId: "cat_3",
    serialNumber: "PLT-TRK-09",
    acquisitionDate: "2023-12-10",
    acquisitionCost: 75000,
    condition: "fair",
    location: "Logistics Warehouse Floor 1",
    sharedFlag: false,
    status: "Available",
    customFields: { "License Plate": "N/A (Warehouse)", "Fuel Type": "Manual Hydraulic", "Last Service Mileage": 0 },
  },
  {
    tag: "AF-0064",
    name: "Electric Golf Cart",
    categoryId: "cat_3",
    serialNumber: "CART-GOLF-02",
    acquisitionDate: "2025-04-01",
    acquisitionCost: 450000,
    condition: "new",
    location: "Campus Transit Bay",
    sharedFlag: true,
    status: "Available",
    customFields: { "License Plate": "N/A (Campus)", "Fuel Type": "Electric", "Last Service Mileage": 800 },
  },
  {
    tag: "AF-0065",
    name: "Ambulance First Response Van",
    categoryId: "cat_3",
    serialNumber: "AMB-VAN-01",
    acquisitionDate: "2024-08-08",
    acquisitionCost: 1600000,
    condition: "good",
    location: "HQ Medical Bay Parking",
    sharedFlag: false,
    status: "Available",
    customFields: { "License Plate": "MH-04-QR-9111", "Fuel Type": "Diesel", "Last Service Mileage": 12000 },
  },
  {
    tag: "AF-0066",
    name: "Executive Traveller Van",
    categoryId: "cat_3",
    serialNumber: "VAN-TRVL-07",
    acquisitionDate: "2025-01-25",
    acquisitionCost: 2100000,
    condition: "new",
    location: "Logistics Vehicle Depot B",
    sharedFlag: true,
    status: "Available",
    customFields: { "License Plate": "DL-4C-V-7788", "Fuel Type": "Diesel", "Last Service Mileage": 9000 },
  },
  {
    tag: "AF-0067",
    name: "Courier Delivery Tempo",
    categoryId: "cat_3",
    serialNumber: "TEMPO-DLV-11",
    acquisitionDate: "2024-04-18",
    acquisitionCost: 680000,
    condition: "good",
    location: "Main Logistics Hub",
    sharedFlag: false,
    status: "Available",
    customFields: { "License Plate": "KA-01-MX-3344", "Fuel Type": "CNG", "Last Service Mileage": 52000 },
  },
  {
    tag: "AF-0068",
    name: "Site Inspection Jeep",
    categoryId: "cat_3",
    serialNumber: "JEEP-INSP-04",
    acquisitionDate: "2025-06-12",
    acquisitionCost: 1800000,
    condition: "new",
    location: "Maintenance Yard B",
    sharedFlag: false,
    status: "Available",
    customFields: { "License Plate": "HR-26-JE-5500", "Fuel Type": "Diesel", "Last Service Mileage": 4500 },
  },
  {
    tag: "AF-0069",
    name: "Canteen Supply Mini Truck",
    categoryId: "cat_3",
    serialNumber: "MTRK-CANT-02",
    acquisitionDate: "2024-10-05",
    acquisitionCost: 560000,
    condition: "good",
    location: "Logistics Vehicle Depot B",
    sharedFlag: false,
    status: "Available",
    customFields: { "License Plate": "MH-14-SK-2211", "Fuel Type": "Diesel", "Last Service Mileage": 28000 },
  },
  {
    tag: "AF-0070",
    name: "Staff EV Shuttle Bus",
    categoryId: "cat_3",
    serialNumber: "BUS-EV-SHUT",
    acquisitionDate: "2026-02-01",
    acquisitionCost: 5500000,
    condition: "new",
    location: "Logistics Vehicle Depot B",
    sharedFlag: true,
    status: "Available",
    customFields: { "License Plate": "MH-04-EV-0101", "Fuel Type": "Electric", "Last Service Mileage": 1500 },
  },

  // --- Category 4: Shared Spaces (cat_4) — Batch 2 ---
  {
    tag: "AF-0071",
    name: "Quiet Focus Room Q1",
    categoryId: "cat_4",
    serialNumber: "QUIET-Q1",
    acquisitionDate: "2025-05-10",
    acquisitionCost: 0,
    condition: "new",
    location: "HQ Wing A Floor 2",
    sharedFlag: true,
    status: "Available",
    customFields: { Capacity: 2, "Projector Equipped": false },
  },
  {
    tag: "AF-0072",
    name: "Innovation Lab Open Space",
    categoryId: "cat_4",
    serialNumber: "INN-LAB-OS",
    acquisitionDate: "2024-10-20",
    acquisitionCost: 0,
    condition: "good",
    location: "R&D Lab Floor 3",
    sharedFlag: true,
    status: "Available",
    customFields: { Capacity: 20, "Projector Equipped": true },
  },
  {
    tag: "AF-0073",
    name: "Podcast & Recording Studio",
    categoryId: "cat_4",
    serialNumber: "POD-STUD-01",
    acquisitionDate: "2025-08-15",
    acquisitionCost: 0,
    condition: "new",
    location: "HQ Wing B Floor 1",
    sharedFlag: true,
    status: "Available",
    customFields: { Capacity: 4, "Projector Equipped": false },
  },
  {
    tag: "AF-0074",
    name: "Client Demo Suite",
    categoryId: "cat_4",
    serialNumber: "DEMO-SUITE-01",
    acquisitionDate: "2025-03-05",
    acquisitionCost: 0,
    condition: "new",
    location: "HQ Wing A Floor 1",
    sharedFlag: true,
    status: "Available",
    customFields: { Capacity: 8, "Projector Equipped": true },
  },
  {
    tag: "AF-0075",
    name: "Wellness & Meditation Room",
    categoryId: "cat_4",
    serialNumber: "WELL-MED-01",
    acquisitionDate: "2024-12-20",
    acquisitionCost: 0,
    condition: "good",
    location: "HQ Wing C Floor 1",
    sharedFlag: true,
    status: "Available",
    customFields: { Capacity: 6, "Projector Equipped": false },
  },
  {
    tag: "AF-0076",
    name: "Maker Space Workshop",
    categoryId: "cat_4",
    serialNumber: "MKR-SHOP-01",
    acquisitionDate: "2025-07-12",
    acquisitionCost: 0,
    condition: "new",
    location: "R&D Lab Floor 1",
    sharedFlag: true,
    status: "Available",
    customFields: { Capacity: 12, "Projector Equipped": false },
  },
  {
    tag: "AF-0077",
    name: "Executive Dining Room",
    categoryId: "cat_4",
    serialNumber: "EXEC-DINE-01",
    acquisitionDate: "2023-09-18",
    acquisitionCost: 0,
    condition: "good",
    location: "HQ Wing A Floor 5",
    sharedFlag: true,
    status: "Available",
    customFields: { Capacity: 16, "Projector Equipped": false },
  },
  {
    tag: "AF-0078",
    name: "Town Hall Event Space",
    categoryId: "cat_4",
    serialNumber: "TOWN-HALL-01",
    acquisitionDate: "2024-04-25",
    acquisitionCost: 0,
    condition: "good",
    location: "HQ Ground Level West",
    sharedFlag: true,
    status: "Available",
    customFields: { Capacity: 200, "Projector Equipped": true },
  },
  {
    tag: "AF-0079",
    name: "Rooftop Event Pavilion",
    categoryId: "cat_4",
    serialNumber: "ROOF-PAV-01",
    acquisitionDate: "2025-02-28",
    acquisitionCost: 0,
    condition: "new",
    location: "HQ Floor 6 Rooftop",
    sharedFlag: true,
    status: "Available",
    customFields: { Capacity: 60, "Projector Equipped": false },
  },
  {
    tag: "AF-0080",
    name: "Video Conference Room VC5",
    categoryId: "cat_4",
    serialNumber: "VC-ROOM-05",
    acquisitionDate: "2025-09-10",
    acquisitionCost: 0,
    condition: "new",
    location: "HQ Wing B Floor 4",
    sharedFlag: true,
    status: "Available",
    customFields: { Capacity: 10, "Projector Equipped": true },
  },
]

const INITIAL_DB: DatabaseCollections = {
  departments: DEPARTMENTS_SEED,
  categories: CATEGORIES_SEED,
  roles: ROLES_SEED,
  users: USERS_SEED,
  assets: ASSETS_SEED,
  allocations: [],
  transfers: [],
  bookings: [],
  maintenance: [],
  audits: [],
  logs: [],
  notifications: [],
}

function mapCollectionToTableName(key: string): string {
  if (key === "bookings") return "bookings"
  if (key === "maintenance") return "maintenance"
  return key
}

function mapRowToCollectionItem(key: string, row: any): any {
  const safeParse = (val: any) => {
    if (typeof val === "string") {
      try {
        return JSON.parse(val)
      } catch {
        return val
      }
    }
    return val
  }

  switch (key) {
    case "departments":
      return {
        id: row.id,
        name: row.name,
        parentId: row.parent_id || undefined,
        managerId: row.manager_id || undefined,
        status: row.status,
      }
    case "categories":
      return {
        id: row.id,
        name: row.name,
        parentId: row.parent_id || undefined,
        fields: safeParse(row.fields),
      }
    case "roles":
      return {
        id: row.id,
        name: row.name,
        permissions: safeParse(row.permissions),
      }
    case "users":
      return {
        id: row.id,
        employeeCode: row.employee_code || undefined,
        firstName: row.first_name,
        lastName: row.last_name,
        fullName: row.full_name,
        email: row.email,
        phone: row.phone || undefined,
        passwordHash: row.password_hash,
        avatar: row.avatar || undefined,
        departmentId: row.department_id || undefined,
        designation: row.designation || undefined,
        roleId: row.role_id,
        status: row.status,
        lastLogin: row.last_login || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }
    case "assets":
      return {
        tag: row.tag,
        name: row.name,
        categoryId: row.category_id,
        serialNumber: row.serial_number,
        acquisitionDate: row.acquisition_date,
        acquisitionCost: Number(row.acquisition_cost),
        condition: row.condition,
        location: row.location,
        sharedFlag: row.shared_flag,
        status: row.status,
        customFields: safeParse(row.custom_fields),
        assignedToUserId: row.assigned_to_user_id || undefined,
      }
    case "allocations":
      return {
        id: row.id,
        assetTag: row.asset_tag,
        userId: row.user_id || undefined,
        departmentId: row.department_id || undefined,
        allocatedAt: row.allocated_at,
        expectedReturnDate: row.expected_return_date || undefined,
        returnedAt: row.returned_at || undefined,
        returnConditionNotes: row.return_condition_notes || undefined,
        status: row.status,
      }
    case "transfers":
      return {
        id: row.id,
        assetTag: row.asset_tag,
        fromUserId: row.from_user_id || undefined,
        toUserId: row.to_user_id,
        departmentId: row.department_id || undefined,
        status: row.status,
        requestedAt: row.requested_at,
        requestedByUserId: row.requested_by_user_id,
        approvedByUserId: row.approved_by_user_id || undefined,
      }
    case "bookings":
      return {
        id: row.id,
        assetTag: row.asset_tag,
        bookedByUserId: row.booked_by_user_id,
        departmentId: row.department_id || undefined,
        startTime: row.start_time,
        endTime: row.end_time,
        status: row.status,
        notes: row.notes || undefined,
      }
    case "maintenance":
      return {
        id: row.id,
        assetTag: row.asset_tag,
        requestedByUserId: row.requested_by_user_id,
        approvedByUserId: row.approved_by_user_id || undefined,
        technicianUserId: row.technician_user_id || undefined,
        description: row.description,
        priority: row.priority,
        status: row.status,
        notes: row.notes || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }
    case "audits":
      return {
        id: row.id,
        name: row.name,
        scopeDepartmentId: row.scope_department_id || undefined,
        scopeLocation: row.scope_location || undefined,
        startDate: row.start_date,
        endDate: row.end_date,
        assignedAuditorUserId: row.assigned_auditor_user_id,
        createdByUserId: row.created_by_user_id,
        status: row.status,
        results: safeParse(row.results),
        notes: row.notes || undefined,
      }
    case "logs":
      return {
        id: row.id,
        userId: row.user_id,
        userName: row.user_name,
        userRole: row.user_role,
        action: row.action,
        entity: row.entity,
        entityId: row.entity_id,
        previousValue: row.previous_value,
        newValue: row.new_value,
        timestamp: row.timestamp,
      }
    case "notifications":
      return {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        message: row.message,
        type: row.type,
        read: row.read,
        timestamp: row.timestamp,
      }
    default:
      throw new Error(`Unknown collection key: ${key}`)
  }
}

function getInsertQueryAndValues(key: string, item: any): { query: string; values: any[] } {
  switch (key) {
    case "departments":
      return {
        query: `INSERT INTO departments (id, name, parent_id, manager_id, status) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`,
        values: [item.id, item.name, item.parentId || null, item.managerId || null, item.status],
      }
    case "categories":
      return {
        query: `INSERT INTO categories (id, name, parent_id, fields) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING`,
        values: [item.id, item.name, item.parentId || null, JSON.stringify(item.fields)],
      }
    case "roles":
      return {
        query: `INSERT INTO roles (id, name, permissions) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
        values: [item.id, item.name, JSON.stringify(item.permissions)],
      }
    case "users":
      return {
        query: `INSERT INTO users (id, employee_code, first_name, last_name, full_name, email, phone, password_hash, avatar, department_id, designation, role_id, status, last_login, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) ON CONFLICT (id) DO NOTHING`,
        values: [
          item.id,
          item.employeeCode || null,
          item.firstName,
          item.lastName,
          item.fullName,
          item.email,
          item.phone || null,
          item.passwordHash,
          item.avatar || null,
          item.departmentId || null,
          item.designation || null,
          item.roleId,
          item.status,
          item.lastLogin || null,
          item.createdAt,
          item.updatedAt,
        ],
      }
    case "assets":
      return {
        query: `INSERT INTO assets (tag, name, category_id, serial_number, acquisition_date, acquisition_cost, condition, location, shared_flag, status, custom_fields, assigned_to_user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) ON CONFLICT (tag) DO NOTHING`,
        values: [
          item.tag,
          item.name,
          item.categoryId,
          item.serialNumber,
          item.acquisitionDate,
          Number(item.acquisitionCost),
          item.condition,
          item.location,
          item.sharedFlag,
          item.status,
          JSON.stringify(item.customFields),
          item.assignedToUserId || null,
        ],
      }
    case "allocations":
      return {
        query: `INSERT INTO allocations (id, asset_tag, user_id, department_id, allocated_at, expected_return_date, returned_at, return_condition_notes, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING`,
        values: [
          item.id,
          item.assetTag,
          item.userId || null,
          item.departmentId || null,
          item.allocatedAt,
          item.expectedReturnDate || null,
          item.returnedAt || null,
          item.returnConditionNotes || null,
          item.status,
        ],
      }
    case "transfers":
      return {
        query: `INSERT INTO transfers (id, asset_tag, from_user_id, to_user_id, department_id, status, requested_at, requested_by_user_id, approved_by_user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING`,
        values: [
          item.id,
          item.assetTag,
          item.fromUserId || null,
          item.toUserId,
          item.departmentId || null,
          item.status,
          item.requestedAt,
          item.requestedByUserId,
          item.approvedByUserId || null,
        ],
      }
    case "bookings":
      return {
        query: `INSERT INTO bookings (id, asset_tag, booked_by_user_id, department_id, start_time, end_time, status, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING`,
        values: [
          item.id,
          item.assetTag,
          item.bookedByUserId,
          item.departmentId || null,
          item.startTime,
          item.endTime,
          item.status,
          item.notes || null,
        ],
      }
    case "maintenance":
      return {
        query: `INSERT INTO maintenance (id, asset_tag, requested_by_user_id, approved_by_user_id, technician_user_id, description, priority, status, notes, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT (id) DO NOTHING`,
        values: [
          item.id,
          item.assetTag,
          item.requestedByUserId,
          item.approvedByUserId || null,
          item.technicianUserId || null,
          item.description,
          item.priority,
          item.status,
          item.notes || null,
          item.createdAt,
          item.updatedAt,
        ],
      }
    case "audits":
      return {
        query: `INSERT INTO audits (id, name, scope_department_id, scope_location, start_date, end_date, assigned_auditor_user_id, created_by_user_id, status, results, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT (id) DO NOTHING`,
        values: [
          item.id,
          item.name,
          item.scopeDepartmentId || null,
          item.scopeLocation || null,
          item.startDate,
          item.endDate,
          item.assignedAuditorUserId,
          item.createdByUserId,
          item.status,
          JSON.stringify(item.results),
          item.notes || null,
        ],
      }
    case "logs":
      return {
        query: `INSERT INTO logs (id, user_id, user_name, user_role, action, entity, entity_id, previous_value, new_value, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (id) DO NOTHING`,
        values: [
          item.id,
          item.userId,
          item.userName,
          item.userRole,
          item.action,
          item.entity,
          item.entityId,
          item.previousValue,
          item.newValue,
          item.timestamp,
        ],
      }
    case "notifications":
      return {
        query: `INSERT INTO notifications (id, user_id, title, message, type, read, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`,
        values: [
          item.id,
          item.userId,
          item.title,
          item.message,
          item.type,
          item.read,
          item.timestamp,
        ],
      }
    default:
      throw new Error(`Unknown collection key: ${key}`)
  }
}

async function syncTableToPostgres(pool: Pool, key: string, data: any[]): Promise<void> {
  const tableName = mapCollectionToTableName(key)
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    await client.query(`DELETE FROM ${tableName}`)
    for (const item of data) {
      const { query, values } = getInsertQueryAndValues(key, item)
      await client.query(query, values)
    }
    await client.query("COMMIT")
  } catch (err) {
    await client.query("ROLLBACK")
    throw err
  } finally {
    client.release()
  }
}

export class Database {
  private static pool: Pool | null = null
  private static activePostgres = false
  private static memoryCache: DatabaseCollections = INITIAL_DB

  static async initialize(): Promise<void> {
    const url = process.env.DATABASE_URL
    if (!url) {
      console.log("DATABASE_URL not found in environment, running in local JSON database mode.")
      this.memoryCache = this.loadDB()
      return
    }

    try {
      console.log("Connecting to PostgreSQL/Neon database...")
      this.pool = new Pool({
        connectionString: url,
        ssl: { rejectUnauthorized: false },
      })

      await this.createSchemas()
      await this.seedPostgresIfEmpty()
      await this.loadAllFromPostgres()

      this.activePostgres = true
      console.log("PostgreSQL/Neon database successfully integrated and synchronized!")
    } catch (err) {
      console.error("Failed to connect or initialize PostgreSQL database, falling back to local JSON mode", err)
      this.activePostgres = false
      this.memoryCache = this.loadDB()
    }
  }

  private static async createSchemas(): Promise<void> {
    if (!this.pool) return

    // Run migration check: if users table doesn't exist, we clean and drop old tables once.
    const res = await this.pool.query(
      `SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users')`
    )
    const usersExist = res.rows[0].exists

    if (!usersExist) {
      console.log("Migration check failed: users table not found. Performing full database drops for RBAC upgrade...")
      const drops = [
        "DROP TABLE IF EXISTS employees CASCADE",
        "DROP TABLE IF EXISTS allocations CASCADE",
        "DROP TABLE IF EXISTS transfers CASCADE",
        "DROP TABLE IF EXISTS bookings CASCADE",
        "DROP TABLE IF EXISTS maintenance CASCADE",
        "DROP TABLE IF EXISTS audits CASCADE",
        "DROP TABLE IF EXISTS logs CASCADE",
        "DROP TABLE IF EXISTS notifications CASCADE",
        "DROP TABLE IF EXISTS assets CASCADE",
        "DROP TABLE IF EXISTS users CASCADE",
        "DROP TABLE IF EXISTS roles CASCADE",
        "DROP TABLE IF EXISTS departments CASCADE",
        "DROP TABLE IF EXISTS categories CASCADE"
      ]
      for (const drop of drops) {
        await this.pool.query(drop)
      }
    }

    const statements = [
      `CREATE TABLE IF NOT EXISTS departments (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        parent_id VARCHAR(255),
        manager_id VARCHAR(255),
        status VARCHAR(50) NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        parent_id VARCHAR(255),
        fields JSONB NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS roles (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        permissions JSONB NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        employee_code VARCHAR(255),
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(255),
        password_hash VARCHAR(255) NOT NULL,
        avatar VARCHAR(255),
        department_id VARCHAR(255),
        designation VARCHAR(255),
        role_id VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        last_login VARCHAR(255),
        created_at VARCHAR(255) NOT NULL,
        updated_at VARCHAR(255) NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS assets (
        tag VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category_id VARCHAR(255) NOT NULL,
        serial_number VARCHAR(255) NOT NULL,
        acquisition_date VARCHAR(255) NOT NULL,
        acquisition_cost NUMERIC NOT NULL,
        condition VARCHAR(50) NOT NULL,
        location VARCHAR(255) NOT NULL,
        shared_flag BOOLEAN NOT NULL DEFAULT FALSE,
        status VARCHAR(50) NOT NULL,
        custom_fields JSONB NOT NULL,
        assigned_to_user_id VARCHAR(255)
      )`,
      `CREATE TABLE IF NOT EXISTS allocations (
        id VARCHAR(255) PRIMARY KEY,
        asset_tag VARCHAR(255) NOT NULL,
        user_id VARCHAR(255),
        department_id VARCHAR(255),
        allocated_at VARCHAR(255) NOT NULL,
        expected_return_date VARCHAR(255),
        returned_at VARCHAR(255),
        return_condition_notes TEXT,
        status VARCHAR(50) NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS transfers (
        id VARCHAR(255) PRIMARY KEY,
        asset_tag VARCHAR(255) NOT NULL,
        from_user_id VARCHAR(255),
        to_user_id VARCHAR(255),
        department_id VARCHAR(255),
        status VARCHAR(50) NOT NULL,
        requested_at VARCHAR(255) NOT NULL,
        requested_by_user_id VARCHAR(255) NOT NULL,
        approved_by_user_id VARCHAR(255)
      )`,
      `CREATE TABLE IF NOT EXISTS bookings (
        id VARCHAR(255) PRIMARY KEY,
        asset_tag VARCHAR(255) NOT NULL,
        booked_by_user_id VARCHAR(255) NOT NULL,
        department_id VARCHAR(255),
        start_time VARCHAR(255) NOT NULL,
        end_time VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        notes TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS maintenance (
        id VARCHAR(255) PRIMARY KEY,
        asset_tag VARCHAR(255) NOT NULL,
        requested_by_user_id VARCHAR(255) NOT NULL,
        approved_by_user_id VARCHAR(255),
        technician_user_id VARCHAR(255),
        description TEXT NOT NULL,
        priority VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        notes TEXT,
        created_at VARCHAR(255) NOT NULL,
        updated_at VARCHAR(255) NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS audits (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        scope_department_id VARCHAR(255),
        scope_location VARCHAR(255),
        start_date VARCHAR(255) NOT NULL,
        end_date VARCHAR(255) NOT NULL,
        assigned_auditor_user_id VARCHAR(255) NOT NULL,
        created_by_user_id VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        results JSONB NOT NULL,
        notes TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS logs (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        user_role VARCHAR(255) NOT NULL,
        action VARCHAR(255) NOT NULL,
        entity VARCHAR(255) NOT NULL,
        entity_id VARCHAR(255) NOT NULL,
        previous_value TEXT NOT NULL,
        new_value TEXT NOT NULL,
        timestamp VARCHAR(255) NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        read BOOLEAN NOT NULL DEFAULT FALSE,
        timestamp VARCHAR(255) NOT NULL
      )`,
    ]

    for (const statement of statements) {
      await this.pool.query(statement)
    }
  }

  private static async seedPostgresIfEmpty(): Promise<void> {
    if (!this.pool) return
    const res = await this.pool.query("SELECT COUNT(*) FROM users")
    const count = parseInt(res.rows[0].count, 10)
    if (count === 0) {
      console.log("PostgreSQL tables empty. Uploading default seed presets...")
      const keys: (keyof DatabaseCollections)[] = [
        "departments",
        "categories",
        "roles",
        "users",
        "assets",
        "allocations",
        "transfers",
        "bookings",
        "maintenance",
        "audits",
        "logs",
        "notifications",
      ]
      for (const key of keys) {
        const seedList = INITIAL_DB[key]
        for (const item of seedList) {
          const { query, values } = getInsertQueryAndValues(key, item)
          await this.pool.query(query, values)
        }
      }
      console.log("Seeding complete.")
    }
  }

  private static async loadAllFromPostgres(): Promise<void> {
    if (!this.pool) return
    const keys: (keyof DatabaseCollections)[] = [
      "departments",
      "categories",
      "roles",
      "users",
      "assets",
      "allocations",
      "transfers",
      "bookings",
      "maintenance",
      "audits",
      "logs",
      "notifications",
    ]
    for (const key of keys) {
      const tableName = mapCollectionToTableName(key)
      const res = await this.pool.query(`SELECT * FROM ${tableName}`)
      this.memoryCache[key] = res.rows.map((row) => mapRowToCollectionItem(key, row)) as any
    }
  }

  private static loadDB(): DatabaseCollections {
    if (!fs.existsSync(DATABASE_FILE)) {
      this.saveDB(INITIAL_DB)
      return INITIAL_DB
    }
    try {
      const content = fs.readFileSync(DATABASE_FILE, "utf-8")
      return JSON.parse(content) as DatabaseCollections
    } catch (e) {
      console.error("Failed to read JSON database, resetting to initial seed", e)
      this.saveDB(INITIAL_DB)
      return INITIAL_DB
    }
  }

  private static saveDB(db: DatabaseCollections): void {
    fs.writeFileSync(DATABASE_FILE, JSON.stringify(db, null, 2), "utf-8")
  }

  static getCollection<K extends keyof DatabaseCollections>(key: K): DatabaseCollections[K] {
    return this.memoryCache[key]
  }

  static saveCollection<K extends keyof DatabaseCollections>(key: K, data: DatabaseCollections[K]): void {
    this.memoryCache[key] = data
    this.saveDB(this.memoryCache)

    if (this.activePostgres && this.pool) {
      syncTableToPostgres(this.pool, key, data).catch((err) => {
        console.error(`Postgres sync failed for collection ${key}:`, err)
      })
    }
  }

  static resetDatabase(): void {
    this.memoryCache = JSON.parse(JSON.stringify(INITIAL_DB))
    this.saveDB(this.memoryCache)

    if (this.activePostgres && this.pool) {
      console.log("Resetting PostgreSQL database to default seeds...")
      const keys: (keyof DatabaseCollections)[] = [
        "departments",
        "categories",
        "roles",
        "users",
        "assets",
        "allocations",
        "transfers",
        "bookings",
        "maintenance",
        "audits",
        "logs",
        "notifications",
      ]
      const performReset = async () => {
        if (!this.pool) return
        for (const key of keys) {
          const tableName = mapCollectionToTableName(key)
          await this.pool.query(`DELETE FROM ${tableName}`)
          const seedList = INITIAL_DB[key]
          for (const item of seedList) {
            const { query, values } = getInsertQueryAndValues(key, item)
            await this.pool.query(query, values)
          }
        }
      }
      performReset().catch((err) => {
        console.error("Postgres reset failed:", err)
      })
    }
  }

  static cleanDatabase(): void {
    this.memoryCache.assets = []
    this.memoryCache.allocations = []
    this.memoryCache.transfers = []
    this.memoryCache.bookings = []
    this.memoryCache.maintenance = []
    this.memoryCache.audits = []
    this.memoryCache.logs = []
    this.memoryCache.notifications = []
    this.saveDB(this.memoryCache)

    if (this.activePostgres && this.pool) {
      console.log("Wiping transactional tables on PostgreSQL database...")
      const tables = ["transfers", "bookings", "maintenance", "audits", "logs", "notifications", "allocations", "assets"]
      const performClean = async () => {
        if (!this.pool) return
        for (const t of tables) {
          const tableName = mapCollectionToTableName(t)
          await this.pool.query(`DELETE FROM ${tableName}`)
        }
      }
      performClean().catch((err) => {
        console.error("Postgres clean failed:", err)
      })
    }
  }
}
