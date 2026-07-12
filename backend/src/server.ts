import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import {
  Database,
  Department,
  AssetCategory,
  User,
  Role,
  Asset,
  AssetAllocation,
  TransferRequest,
  ResourceBooking,
  MaintenanceRequest,
  AuditCycle,
  ActivityLog,
  Notification,
  hashPassword,
} from "./db"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

// Helper for logger activity
function logActivity(
  userId: string,
  userName: string,
  action: string,
  details: string,
  userRole?: string,
  entity?: string,
  entityId?: string,
  previousValue?: string,
  newValue?: string
) {
  const logs = Database.getCollection("logs")
  const users = Database.getCollection("users")
  const user = users.find((u) => u.id === userId)
  const finalRole = userRole || user?.roleId || "employee"

  const newLog: ActivityLog = {
    id: `log_${Math.random().toString(36).substring(2, 11)}`,
    userId,
    userName,
    userRole: finalRole,
    action,
    entity: entity || "general",
    entityId: entityId || "",
    previousValue: previousValue || "",
    newValue: newValue || details,
    timestamp: new Date().toISOString(),
  }
  logs.unshift(newLog)
  Database.saveCollection("logs", logs)
}

// Helper for notifications
function sendNotification(userId: string, title: string, message: string, type: "general" | "maintenance" | "audit" | "approval") {
  const notifications = Database.getCollection("notifications")
  const newNot: Notification = {
    id: `not_${Math.random().toString(36).substring(2, 11)}`,
    userId,
    title,
    message,
    type,
    read: false,
    timestamp: new Date().toISOString(),
  }
  notifications.unshift(newNot)
  Database.saveCollection("notifications", notifications)
}

// Helper for asset history
interface AssetHistoryEntry {
  id: string
  assetTag: string
  date: string
  type: "registration" | "allocation" | "return" | "transfer" | "maintenance" | "audit" | "booking"
  details: string
  performedBy: string
}

function getAssetHistory(tag: string): AssetHistoryEntry[] {
  const fs = require("fs")
  const path = require("path")
  const dir = path.join(process.cwd(), "histories")
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  const file = path.join(dir, `history_${tag}.json`)
  if (!fs.existsSync(file)) {
    return []
  }
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"))
  } catch {
    return []
  }
}

function addAssetHistory(tag: string, type: AssetHistoryEntry["type"], details: string, performedBy: string) {
  const fs = require("fs")
  const path = require("path")
  const dir = path.join(process.cwd(), "histories")
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  const file = path.join(dir, `history_${tag}.json`)
  const history = getAssetHistory(tag)
  const newEntry: AssetHistoryEntry = {
    id: `hist_${Math.random().toString(36).substring(2, 11)}`,
    assetTag: tag,
    date: new Date().toISOString(),
    type,
    details,
    performedBy,
  }
  history.unshift(newEntry)
  fs.writeFileSync(file, JSON.stringify(history, null, 2), "utf-8")
}

// ----------------------------------------------------
// 1. AUTH ROUTES
// ----------------------------------------------------
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body
  const users = Database.getCollection("users")
  const match = users.find((u) => u.email.toLowerCase() === email.toLowerCase())
  if (!match) {
    return res.status(401).json({ message: "No user registered with this email." })
  }
  if (match.status !== "active") {
    return res.status(403).json({ message: "User account is suspended or inactive." })
  }
  if (password !== undefined) {
    const hash = hashPassword(password)
    if (match.passwordHash !== hash) {
      return res.status(401).json({ message: "Invalid credentials." })
    }
  }
  match.lastLogin = new Date().toISOString()
  Database.saveCollection("users", users)
  res.json(match)
})

app.post("/api/auth/signup", (req, res) => {
  const { name, email, password } = req.body
  const users = Database.getCollection("users")
  const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase())
  if (exists) {
    return res.status(400).json({ message: "A user with this email already exists." })
  }
  const parts = name.split(" ")
  const firstName = parts[0] || "User"
  const lastName = parts.slice(1).join(" ") || "Employee"
  const newUsr: User = {
    id: `usr_${Math.random().toString(36).substring(2, 11)}`,
    employeeCode: `AF-EMP-${Math.floor(1000 + Math.random() * 9000)}`,
    firstName,
    lastName,
    fullName: name,
    email,
    passwordHash: hashPassword(password || "employee123"),
    avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${firstName}`,
    roleId: "employee",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  users.push(newUsr)
  Database.saveCollection("users", users)
  logActivity(newUsr.id, newUsr.fullName, "Sign Up", `User registered successfully.`, "employee")
  res.json({ success: true, user: newUsr })
})

app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body
  const users = Database.getCollection("users")
  const match = users.some((u) => u.email.toLowerCase() === email.toLowerCase())
  if (!match) {
    return res.status(404).json({ message: "Email address not found." })
  }
  res.json({ success: true, message: "Password reset instructions dispatched." })
})

// ----------------------------------------------------
// 2. USER MANAGEMENT & ORG ROUTES
// ----------------------------------------------------
app.get("/api/org/users", (req, res) => {
  res.json(Database.getCollection("users"))
})

app.post("/api/org/users", (req, res) => {
  const { employeeCode, firstName, lastName, email, phone, password, departmentId, designation, roleId, operatorId, operatorName } = req.body
  const users = Database.getCollection("users")
  const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase())
  if (exists) {
    return res.status(400).json({ message: "A user with this email already exists." })
  }
  const fullName = `${firstName} ${lastName}`
  const newUser: User = {
    id: `usr_${Math.random().toString(36).substring(2, 11)}`,
    employeeCode: employeeCode || `AF-EMP-${Math.floor(1000 + Math.random() * 9000)}`,
    firstName,
    lastName,
    fullName,
    email,
    phone,
    passwordHash: hashPassword(password || "user123"),
    avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${firstName}`,
    departmentId: departmentId || undefined,
    designation,
    roleId,
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  users.push(newUser)
  Database.saveCollection("users", users)
  logActivity(operatorId, operatorName, "Create User", `Created user account for: ${fullName}`)
  res.json(newUser)
})

app.put("/api/org/users/:id", (req, res) => {
  const { id } = req.params
  const { firstName, lastName, phone, departmentId, designation, roleId, status, operatorId, operatorName } = req.body
  const users = Database.getCollection("users")
  const idx = users.findIndex((u) => u.id === id)
  if (idx === -1) return res.status(404).json({ message: "User not found." })

  const old = users[idx]
  users[idx] = {
    ...old,
    firstName: firstName !== undefined ? firstName : old.firstName,
    lastName: lastName !== undefined ? lastName : old.lastName,
    fullName: (firstName || lastName) ? `${firstName || old.firstName} ${lastName || old.lastName}` : old.fullName,
    phone: phone !== undefined ? phone : old.phone,
    departmentId: departmentId !== undefined ? departmentId : old.departmentId,
    designation: designation !== undefined ? designation : old.designation,
    roleId: roleId !== undefined ? roleId : old.roleId,
    status: status !== undefined ? status : old.status,
    updatedAt: new Date().toISOString(),
  }
  Database.saveCollection("users", users)
  logActivity(operatorId, operatorName, "Update User", `Updated profile attributes for: ${users[idx].fullName}`)
  res.json(users[idx])
})

app.post("/api/org/users/:id/reset-password", (req, res) => {
  const { id } = req.params
  const { password, operatorId, operatorName } = req.body
  const users = Database.getCollection("users")
  const match = users.find((u) => u.id === id)
  if (!match) return res.status(404).json({ message: "User not found." })

  match.passwordHash = hashPassword(password)
  match.updatedAt = new Date().toISOString()
  Database.saveCollection("users", users)
  logActivity(operatorId, operatorName, "Reset User Password", `Reset login credentials for user: ${match.fullName}`)
  res.json({ success: true, message: "Credentials updated successfully." })
})

app.get("/api/org/roles", (req, res) => {
  res.json(Database.getCollection("roles"))
})

app.get("/api/org/departments", (req, res) => {
  res.json(Database.getCollection("departments"))
})

app.post("/api/org/departments", (req, res) => {
  const { name, parentId, managerId, operatorId, operatorName } = req.body
  const depts = Database.getCollection("departments")
  const newDept: Department = {
    id: `dept_${Math.random().toString(36).substring(2, 11)}`,
    name,
    parentId: parentId || undefined,
    managerId: managerId || undefined,
    status: "active",
  }
  depts.push(newDept)
  Database.saveCollection("departments", depts)
  logActivity(operatorId, operatorName, "Create Department", `Created department: ${name}`)
  res.json(newDept)
})

app.put("/api/org/departments/:id", (req, res) => {
  const { id } = req.params
  const { name, parentId, managerId, operatorId, operatorName } = req.body
  const depts = Database.getCollection("departments")
  const index = depts.findIndex((d) => d.id === id)
  if (index === -1) return res.status(404).json({ message: "Department not found." })
  depts[index] = {
    ...depts[index],
    name: name !== undefined ? name : depts[index].name,
    parentId: parentId !== undefined ? parentId : depts[index].parentId,
    managerId: managerId !== undefined ? managerId : depts[index].managerId,
  }
  Database.saveCollection("departments", depts)
  logActivity(operatorId, operatorName, "Update Department", `Updated department: ${depts[index].name}`)
  res.json(depts[index])
})

app.get("/api/org/categories", (req, res) => {
  res.json(Database.getCollection("categories"))
})

app.post("/api/org/categories", (req, res) => {
  const { name, parentId, fields, operatorId, operatorName } = req.body
  const cats = Database.getCollection("categories")
  const newCat: AssetCategory = {
    id: `cat_${Math.random().toString(36).substring(2, 11)}`,
    name,
    parentId: parentId || undefined,
    fields,
  }
  cats.push(newCat)
  Database.saveCollection("categories", cats)
  logActivity(operatorId, operatorName, "Create Category", `Created category: ${name}`)
  res.json(newCat)
})

app.put("/api/org/categories/:id", (req, res) => {
  const { id } = req.params
  const { name, parentId, fields, operatorId, operatorName } = req.body
  const cats = Database.getCollection("categories")
  const index = cats.findIndex((c) => c.id === id)
  if (index === -1) return res.status(404).json({ message: "Category not found." })
  cats[index] = {
    ...cats[index],
    name: name !== undefined ? name : cats[index].name,
    parentId: parentId !== undefined ? parentId : cats[index].parentId,
    fields: fields !== undefined ? fields : cats[index].fields,
  }
  Database.saveCollection("categories", cats)
  logActivity(operatorId, operatorName, "Update Category", `Updated category: ${cats[index].name}`)
  res.json(cats[index])
})

// ----------------------------------------------------
// 3. ASSETS ROUTES
// ----------------------------------------------------
app.get("/api/assets", (req, res) => {
  res.json(Database.getCollection("assets"))
})

app.post("/api/assets", (req, res) => {
  let { tag, name, categoryId, serialNumber, acquisitionDate, acquisitionCost, condition, location, sharedFlag, customFields, operatorId, operatorName } = req.body
  const assets = Database.getCollection("assets")
  
  if (!tag || tag === "undefined") {
    let generatedTag = ""
    let attempts = 0
    do {
      generatedTag = `AF-${Math.floor(1000 + Math.random() * 9000)}`
      attempts++
    } while (assets.some((a) => a.tag.toLowerCase() === generatedTag.toLowerCase()) && attempts < 100)
    tag = generatedTag
  }

  const exists = assets.some((a) => a.tag.toLowerCase() === tag.toLowerCase())
  if (exists) {
    return res.status(400).json({ message: `Asset tag ${tag} is already registered.` })
  }
  const newAsset: Asset = {
    tag,
    name,
    categoryId,
    serialNumber,
    acquisitionDate,
    acquisitionCost,
    condition,
    location,
    sharedFlag: !!sharedFlag,
    status: "Available",
    customFields: customFields || {},
  }
  assets.push(newAsset)
  Database.saveCollection("assets", assets)

  addAssetHistory(tag, "registration", `Registered asset. Initial condition: ${condition}. Location: ${location}`, operatorName)
  logActivity(operatorId, operatorName, "Register Asset", `Registered asset ${tag} (${name})`)
  res.json(newAsset)
})

app.put("/api/assets/:tag", (req, res) => {
  const { tag } = req.params
  const { name, condition, location, status, customFields, assignedToUserId, operatorId, operatorName } = req.body
  const assets = Database.getCollection("assets")
  const index = assets.findIndex((a) => a.tag === tag)
  if (index === -1) return res.status(404).json({ message: "Asset not found." })

  const old = assets[index]
  assets[index] = {
    ...old,
    name: name !== undefined ? name : old.name,
    condition: condition !== undefined ? condition : old.condition,
    location: location !== undefined ? location : old.location,
    status: status !== undefined ? status : old.status,
    customFields: customFields !== undefined ? customFields : old.customFields,
    assignedToUserId: assignedToUserId !== undefined ? assignedToUserId : old.assignedToUserId,
  }
  Database.saveCollection("assets", assets)
  logActivity(operatorId, operatorName, "Update Asset", `Updated asset details for ${tag}`)
  res.json(assets[index])
})

app.get("/api/assets/:tag/history", (req, res) => {
  res.json(getAssetHistory(req.params.tag))
})

// ----------------------------------------------------
// 4. ALLOCATIONS & CUSTODY ROUTES
// ----------------------------------------------------
app.get("/api/allocations", (req, res) => {
  res.json(Database.getCollection("allocations"))
})

app.post("/api/allocations", (req, res) => {
  const { assetTag, employeeId, departmentId, expectedReturnDate, operatorId, operatorName } = req.body
  const assets = Database.getCollection("assets")
  const assetIndex = assets.findIndex((a) => a.tag === assetTag)
  if (assetIndex === -1) return res.status(404).json({ message: "Asset not found." })
  if (assets[assetIndex].status !== "Available") {
    return res.status(400).json({ message: `Asset ${assetTag} is currently ${assets[assetIndex].status} and cannot be allocated.` })
  }

  const allocations = Database.getCollection("allocations")
  const newAlloc: AssetAllocation = {
    id: `alloc_${Math.random().toString(36).substring(2, 11)}`,
    assetTag,
    userId: employeeId || undefined,
    departmentId: departmentId || undefined,
    allocatedAt: new Date().toISOString().split("T")[0],
    expectedReturnDate: expectedReturnDate || undefined,
    status: "active",
  }
  allocations.push(newAlloc)
  Database.saveCollection("allocations", allocations)

  assets[assetIndex].status = "Allocated"
  assets[assetIndex].assignedToUserId = employeeId || undefined
  Database.saveCollection("assets", assets)

  const targetName = employeeId ? `user ${employeeId}` : `department ${departmentId}`
  addAssetHistory(assetTag, "allocation", `Allocated custody to ${targetName}. Expected Return: ${expectedReturnDate || "Indefinite"}`, operatorName)
  logActivity(operatorId, operatorName, "Allocate Asset", `Allocated ${assetTag} to ${targetName}`)
  res.json(newAlloc)
})

app.post("/api/allocations/return", (req, res) => {
  const { assetTag, returnConditionNotes, returnCondition, operatorId, operatorName } = req.body
  const allocations = Database.getCollection("allocations")
  const alloc = allocations.find((a) => a.assetTag === assetTag && a.status === "active")
  if (!alloc) return res.status(404).json({ message: "No active allocation custody found for this tag." })

  alloc.status = "returned"
  alloc.returnedAt = new Date().toISOString().split("T")[0]
  alloc.returnConditionNotes = returnConditionNotes
  Database.saveCollection("allocations", allocations)

  const assets = Database.getCollection("assets")
  const assetIndex = assets.findIndex((a) => a.tag === assetTag)
  if (assetIndex !== -1) {
    assets[assetIndex].status = "Available"
    assets[assetIndex].assignedToUserId = undefined
    if (returnCondition) {
      assets[assetIndex].condition = returnCondition
    }
    Database.saveCollection("assets", assets)
  }

  addAssetHistory(assetTag, "return", `Checked-in custody return. Condition notes: ${returnConditionNotes || "None"}`, operatorName)
  logActivity(operatorId, operatorName, "Return Custody", `Returned custody check-in for ${assetTag}`)
  res.json(alloc)
})

app.get("/api/transfers", (req, res) => {
  res.json(Database.getCollection("transfers"))
})

app.post("/api/transfers", (req, res) => {
  const { assetTag, fromEmployeeId, toEmployeeId, departmentId, operatorId, operatorName } = req.body
  const transfers = Database.getCollection("transfers")
  const newTransfer: TransferRequest = {
    id: `trans_${Math.random().toString(36).substring(2, 11)}`,
    assetTag,
    fromUserId: fromEmployeeId,
    toUserId: toEmployeeId,
    departmentId,
    status: "Pending",
    requestedAt: new Date().toISOString(),
    requestedByUserId: operatorId,
  }
  transfers.push(newTransfer)
  Database.saveCollection("transfers", transfers)

  addAssetHistory(assetTag, "transfer", `Custody transfer request submitted to user ${toEmployeeId}`, operatorName)
  sendNotification(toEmployeeId, "Custody Transfer Request", `${operatorName} requested custody transfer for ${assetTag}.`, "approval")
  logActivity(operatorId, operatorName, "Create Transfer", `Requested custody transfer for ${assetTag}`)
  res.json(newTransfer)
})

app.post("/api/transfers/:id/approve", (req, res) => {
  const { id } = req.params
  const { operatorId, operatorName } = req.body
  const transfers = Database.getCollection("transfers")
  const reqMatch = transfers.find((t) => t.id === id)
  if (!reqMatch) return res.status(404).json({ message: "Transfer request not found." })
  if (reqMatch.status !== "Pending") return res.status(400).json({ message: "Transfer request is already resolved." })

  reqMatch.status = "Approved"
  reqMatch.approvedByUserId = operatorId
  Database.saveCollection("transfers", transfers)

  const allocations = Database.getCollection("allocations")
  const activeAlloc = allocations.find((a) => a.assetTag === reqMatch.assetTag && a.status === "active")
  if (activeAlloc) {
    activeAlloc.status = "returned"
    activeAlloc.returnedAt = new Date().toISOString().split("T")[0]
    activeAlloc.returnConditionNotes = "Bypassed via custody transfer approval."
  }

  const newAlloc: AssetAllocation = {
    id: `alloc_${Math.random().toString(36).substring(2, 11)}`,
    assetTag: reqMatch.assetTag,
    userId: reqMatch.toUserId,
    departmentId: reqMatch.departmentId,
    allocatedAt: new Date().toISOString().split("T")[0],
    status: "active",
  }
  allocations.push(newAlloc)
  Database.saveCollection("allocations", allocations)

  const assets = Database.getCollection("assets")
  const asset = assets.find((a) => a.tag === reqMatch.assetTag)
  if (asset) {
    asset.status = "Allocated"
    asset.assignedToUserId = reqMatch.toUserId
    Database.saveCollection("assets", assets)
  }

  addAssetHistory(reqMatch.assetTag, "transfer", `Transfer approved by ${operatorName}. Custody shifted to user ${reqMatch.toUserId}.`, operatorName)
  sendNotification(reqMatch.toUserId, "Transfer Approved", `Custody transfer for ${reqMatch.assetTag} was approved.`, "approval")
  if (reqMatch.fromUserId) {
    sendNotification(reqMatch.fromUserId, "Custody Transferred", `Your custody of ${reqMatch.assetTag} was transferred to user ${reqMatch.toUserId}.`, "approval")
  }

  logActivity(operatorId, operatorName, "Approve Transfer", `Approved custody transfer for ${reqMatch.assetTag}`)
  res.json(reqMatch)
})

app.post("/api/transfers/:id/reject", (req, res) => {
  const { id } = req.params
  const { operatorId, operatorName } = req.body
  const transfers = Database.getCollection("transfers")
  const reqMatch = transfers.find((t) => t.id === id)
  if (!reqMatch) return res.status(404).json({ message: "Transfer request not found." })
  if (reqMatch.status !== "Pending") return res.status(400).json({ message: "Transfer request is already resolved." })

  reqMatch.status = "Rejected"
  Database.saveCollection("transfers", transfers)

  addAssetHistory(reqMatch.assetTag, "transfer", `Transfer request rejected by ${operatorName}.`, operatorName)
  sendNotification(reqMatch.toUserId, "Transfer Rejected", `Custody transfer for ${reqMatch.assetTag} was rejected.`, "approval")
  logActivity(operatorId, operatorName, "Reject Transfer", `Rejected custody transfer for ${reqMatch.assetTag}`)
  res.json(reqMatch)
})

// ----------------------------------------------------
// 5. RESOURCE BOOKINGS ROUTES
// ----------------------------------------------------
app.get("/api/bookings", (req, res) => {
  res.json(Database.getCollection("bookings"))
})

app.post("/api/bookings", (req, res) => {
  const { assetTag, employeeId, departmentId, startTime, endTime, notes, operatorId, operatorName } = req.body
  const bookings = Database.getCollection("bookings")

  const isOverlapping = bookings.some((b) => {
    if (b.assetTag !== assetTag || b.status === "Cancelled") return false
    return startTime < b.endTime && endTime > b.startTime
  })

  if (isOverlapping) {
    return res.status(409).json({ message: "Conflict detected: The selected slot overlaps with an existing reservation." })
  }

  const newBooking: ResourceBooking = {
    id: `book_${Math.random().toString(36).substring(2, 11)}`,
    assetTag,
    bookedByUserId: employeeId,
    departmentId: departmentId || undefined,
    startTime,
    endTime,
    status: "Upcoming",
    notes,
  }
  bookings.push(newBooking)
  Database.saveCollection("bookings", bookings)

  addAssetHistory(assetTag, "booking", `Resource reservation booked for slot: ${startTime} to ${endTime}`, operatorName)
  logActivity(operatorId, operatorName, "Book Resource", `Booked resource ${assetTag} for slot ${startTime}`)
  res.json(newBooking)
})

app.post("/api/bookings/:id/cancel", (req, res) => {
  const { id } = req.params
  const { operatorId, operatorName } = req.body
  const bookings = Database.getCollection("bookings")
  const match = bookings.find((b) => b.id === id)
  if (!match) return res.status(404).json({ message: "Reservation not found." })

  match.status = "Cancelled"
  Database.saveCollection("bookings", bookings)

  addAssetHistory(match.assetTag, "booking", `Reservation cancelled.`, operatorName)
  logActivity(operatorId, operatorName, "Cancel Booking", `Cancelled reservation for ${match.assetTag}`)
  res.json(match)
})

// ----------------------------------------------------
// 6. MAINTENANCE ROUTES
// ----------------------------------------------------
app.get("/api/maintenance", (req, res) => {
  res.json(Database.getCollection("maintenance"))
})

app.post("/api/maintenance", (req, res) => {
  const { assetTag, employeeId, description, priority, operatorId, operatorName } = req.body
  const list = Database.getCollection("maintenance")
  const newReq: MaintenanceRequest = {
    id: `maint_${Math.random().toString(36).substring(2, 11)}`,
    assetTag,
    requestedByUserId: employeeId,
    description,
    priority,
    status: "Pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  list.push(newReq)
  Database.saveCollection("maintenance", list)

  const assets = Database.getCollection("assets")
  const asset = assets.find((a) => a.tag === assetTag)
  if (asset) {
    asset.status = "Under Maintenance"
    Database.saveCollection("assets", assets)
  }

  addAssetHistory(assetTag, "maintenance", `Logged repair ticket: ${description}. Priority: ${priority}`, operatorName)
  logActivity(operatorId, operatorName, "Log Repair Ticket", `Logged repair request for ${assetTag}`)
  res.json(newReq)
})

app.post("/api/maintenance/:id/assign", (req, res) => {
  const { id } = req.params
  const { technicianName, technicianUserId, notes, operatorId, operatorName } = req.body
  const list = Database.getCollection("maintenance")
  const match = list.find((m) => m.id === id)
  if (!match) return res.status(404).json({ message: "Ticket not found." })

  match.status = "In Progress"
  match.technicianUserId = technicianUserId
  match.notes = notes
  match.updatedAt = new Date().toISOString()
  Database.saveCollection("maintenance", list)

  addAssetHistory(match.assetTag, "maintenance", `Repair ticket assigned to technician. Notes: ${notes}`, operatorName)
  logActivity(operatorId, operatorName, "Assign Technician", `Assigned technician to ticket ${id}`)
  res.json(match)
})

app.post("/api/maintenance/:id/resolve", (req, res) => {
  const { id } = req.params
  const { notes, newCondition, operatorId, operatorName } = req.body
  const list = Database.getCollection("maintenance")
  const match = list.find((m) => m.id === id)
  if (!match) return res.status(404).json({ message: "Ticket not found." })

  match.status = "Resolved"
  match.notes = notes
  match.updatedAt = new Date().toISOString()
  Database.saveCollection("maintenance", list)

  const assets = Database.getCollection("assets")
  const asset = assets.find((a) => a.tag === match.assetTag)
  if (asset) {
    asset.status = "Available"
    asset.condition = newCondition
    Database.saveCollection("assets", assets)
  }

  addAssetHistory(match.assetTag, "maintenance", `Repair ticket resolved. Asset condition: ${newCondition}. Resolution notes: ${notes}`, operatorName)
  sendNotification(match.requestedByUserId, "Equipment Repaired", `Your repair ticket for ${match.assetTag} was resolved.`, "maintenance")
  logActivity(operatorId, operatorName, "Resolve Repair Ticket", `Resolved repair ticket ${id}`)
  res.json(match)
})

// ----------------------------------------------------
// 7. AUDITS ROUTES
// ----------------------------------------------------
app.get("/api/audits", (req, res) => {
  res.json(Database.getCollection("audits"))
})

app.post("/api/audits", (req, res) => {
  const { name, scopeDepartmentId, scopeLocation, startDate, endDate, auditorIds, notes, operatorId, operatorName } = req.body
  const cycles = Database.getCollection("audits")
  const assignedAuditor = Array.isArray(auditorIds) ? auditorIds[0] || "usr_admin" : auditorIds || "usr_admin"
  const newCycle: AuditCycle = {
    id: `audit_${Math.random().toString(36).substring(2, 11)}`,
    name,
    scopeDepartmentId: scopeDepartmentId || undefined,
    scopeLocation: scopeLocation || undefined,
    startDate,
    endDate,
    assignedAuditorUserId: assignedAuditor,
    createdByUserId: operatorId,
    status: "Active",
    results: {},
    notes,
  }
  cycles.push(newCycle)
  Database.saveCollection("audits", cycles)

  sendNotification(assignedAuditor, "Assigned to Audit Cycle", `You have been assigned as auditor for: ${name}.`, "audit")
  logActivity(operatorId, operatorName, "Create Audit Cycle", `Created audit cycle: ${name}`)
  res.json(newCycle)
})

app.post("/api/audits/:id/record", (req, res) => {
  const { id } = req.params
  const { assetTag, result, operatorId, operatorName } = req.body
  const cycles = Database.getCollection("audits")
  const match = cycles.find((c) => c.id === id)
  if (!match) return res.status(404).json({ message: "Audit cycle not found." })
  if (match.status !== "Active") return res.status(400).json({ message: "Cannot record results on a closed cycle." })

  match.results[assetTag] = result
  Database.saveCollection("audits", cycles)

  addAssetHistory(assetTag, "audit", `Audited during cycle [${match.name}]: Marked as ${result}`, operatorName)
  res.json(match)
})

app.post("/api/audits/:id/close", (req, res) => {
  const { id } = req.params
  const { operatorId, operatorName } = req.body
  const cycles = Database.getCollection("audits")
  const match = cycles.find((c) => c.id === id)
  if (!match) return res.status(404).json({ message: "Audit cycle not found." })
  if (match.status !== "Active") return res.status(400).json({ message: "Audit cycle is already closed." })

  match.status = "Closed"
  Database.saveCollection("audits", cycles)

  const assets = Database.getCollection("assets")
  Object.entries(match.results).forEach(([tag, result]) => {
    if (result === "Missing") {
      const asset = assets.find((a) => a.tag === tag)
      if (asset) {
        asset.status = "Lost"
        Database.saveCollection("assets", assets)
      }
      addAssetHistory(tag, "audit", `Confirmed missing in audit closure. Status set to Lost.`, operatorName)
    } else if (result === "Damaged") {
      const users = Database.getCollection("users")
      const managers = users.filter((u) => u.roleId === "asset_manager" || u.roleId === "sys_admin" || u.roleId === "org_admin")
      managers.forEach((m) => {
        sendNotification(m.id, "Damaged Equipment Reported", `Asset ${tag} was verified as Damaged during audit cycle [${match.name}].`, "audit")
      })
    }
  })

  logActivity(operatorId, operatorName, "Close Audit Cycle", `Closed audit cycle: ${match.name}`)
  res.json(match)
})

// ----------------------------------------------------
// 8. LOGS & NOTIFICATIONS ROUTES
// ----------------------------------------------------
app.get("/api/logs", (req, res) => {
  res.json(Database.getCollection("logs"))
})

app.get("/api/notifications/:userId", (req, res) => {
  const { userId } = req.params
  const list = Database.getCollection("notifications")
  res.json(list.filter((n) => n.userId === userId))
})

app.post("/api/notifications/:id/read", (req, res) => {
  const { id } = req.params
  const list = Database.getCollection("notifications")
  const match = list.find((n) => n.id === id)
  if (match) {
    match.read = true
    Database.saveCollection("notifications", list)
  }
  res.json({ success: true })
})

app.post("/api/db/reset", (req, res) => {
  Database.resetDatabase()
  res.json({ success: true, message: "Database restored to default seeds." })
})

app.post("/api/db/clean", (req, res) => {
  Database.cleanDatabase()
  res.json({ success: true, message: "Database wiped completely clean." })
})

// ----------------------------------------------------
// RUN SERVER
// ----------------------------------------------------
app.listen(PORT, async () => {
  console.log(`AssetFlow Server running on port ${PORT}`)
  await Database.initialize()
})
