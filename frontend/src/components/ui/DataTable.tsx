import React, { useState, useMemo } from "react"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "./Table"
import { Input } from "./Input"
import { Button } from "./Button"
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Search } from "lucide-react"

export interface Column<T> {
  header: string
  accessor: keyof T | ((item: T) => React.ReactNode)
  sortable?: boolean
  sortKey?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchPlaceholder?: string
  searchKeys?: (keyof T)[]
  pageSize?: number
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchPlaceholder = "Search records...",
  searchKeys = [],
  pageSize = 10,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null)

  // 1. Search filter
  const filteredData = useMemo(() => {
    if (!searchQuery || searchKeys.length === 0) return data

    const query = searchQuery.toLowerCase()
    return data.filter((item) => {
      return searchKeys.some((key) => {
        const val = item[key]
        if (val === undefined || val === null) return false
        return String(val).toLowerCase().includes(query)
      })
    })
  }, [data, searchQuery, searchKeys])

  // 2. Sorting
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData

    const sorted = [...filteredData]
    sorted.sort((a, b) => {
      let valA = a[sortConfig.key]
      let valB = b[sortConfig.key]

      if (typeof valA === "string") {
        valA = valA.toLowerCase()
        valB = (valB || "").toLowerCase()
      }

      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1
      return 0
    })
    return sorted
  }, [filteredData, sortConfig])

  // 3. Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize)
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedData.slice(start, start + pageSize)
  }, [sortedData, currentPage, pageSize])

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
    setCurrentPage(1)
  }

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      {searchKeys.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60 z-10" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            placeholder={searchPlaceholder}
            className="pl-9 text-xs h-9"
          />
        </div>
      )}

      {/* Table Container */}
      <div className="rounded-md border border-border/80 overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/10">
              {columns.map((col, idx) => {
                const isSortable = col.sortable && typeof col.accessor === "string"
                const sortKey = (col.sortKey || col.accessor) as string

                return (
                  <TableHead
                    key={idx}
                    onClick={() => isSortable && handleSort(sortKey)}
                    className={isSortable ? "cursor-pointer select-none hover:bg-muted/20 text-xs" : "text-xs"}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {isSortable && sortConfig?.key === sortKey && (
                        sortConfig.direction === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-xs text-muted-foreground">
                  No records found matching current query parameters.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item, rowIdx) => (
                <TableRow key={rowIdx}>
                  {columns.map((col, colIdx) => {
                    let content: React.ReactNode
                    if (typeof col.accessor === "function") {
                      content = col.accessor(item)
                    } else {
                      content = String(item[col.accessor] ?? "")
                    }

                    return (
                      <TableCell key={colIdx} className="text-xs py-2.5">
                        {content}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-1 text-xs">
          <span className="text-muted-foreground font-medium">
            Showing Page {currentPage} of {totalPages} ({filteredData.length} records found)
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
