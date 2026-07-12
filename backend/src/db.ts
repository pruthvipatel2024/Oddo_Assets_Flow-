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
  {
    tag: "AF-0001",
    name: "MacBook Pro M3",
    categoryId: "cat_1",
    serialNumber: "MBP39482934",
    acquisitionDate: "2026-01-15",
    acquisitionCost: 2499,
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
    acquisitionCost: 1899,
    condition: "good",
    location: "IT Storage Room A",
    sharedFlag: false,
    status: "Allocated",
    customFields: { RAM: "32GB", Processor: "Intel i7", Storage: "1TB SSD" },
    assignedToUserId: "usr_employee",
  },
  {
    tag: "AF-0003",
    name: "Ergonomic Desk Chair",
    categoryId: "cat_2",
    serialNumber: "CH-ERGO-091",
    acquisitionDate: "2025-11-20",
    acquisitionCost: 350,
    condition: "good",
    location: "Design Studio Floor 2",
    sharedFlag: false,
    status: "Available",
    customFields: { Material: "Mesh & Steel", Dimensions: "24x24x45 inches" },
  },
  {
    tag: "AF-0004",
    name: "Zebra Barcode Scanner",
    categoryId: "cat_1",
    serialNumber: "ZEB-93847-X",
    acquisitionDate: "2024-03-05",
    acquisitionCost: 250,
    condition: "fair",
    location: "Main Logistics Hub",
    sharedFlag: false,
    status: "Under Maintenance",
    customFields: { RAM: "N/A", Processor: "ARM Cortex", Storage: "128MB Flash" },
  },
  {
    tag: "AF-0005",
    name: "Company Shuttle Van",
    categoryId: "cat_3",
    serialNumber: "VAN-SHUTTLE-88",
    acquisitionDate: "2023-08-12",
    acquisitionCost: 42000,
    condition: "good",
    location: "Logistics Vehicle Depot B",
    sharedFlag: true,
    status: "Available",
    customFields: { "License Plate": "NY-882-AF", "Fuel Type": "Diesel", "Last Service Mileage": 45000 },
  },
  {
    tag: "AF-0006",
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
