'use client'

import { useState, useEffect } from 'react'
import { trpc } from '@/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@homelab/ui/card'
import { Label } from '@homelab/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@homelab/ui/select'
import { Slider } from '@homelab/ui/slider'
import { Input } from '@homelab/ui/input'
import { Button } from '@homelab/ui/button'
import { Checkbox } from '@homelab/ui/checkbox'
import { DateRangePicker, type DateRange } from '@homelab/ui/date-range-picker'
import { Search, X } from 'lucide-react'
import type { DashboardFilters } from '@/app/(dashboard)/dashboard/page'

interface FilterSidebarProps {
  filters: DashboardFilters
  onFiltersChange: (filters: DashboardFilters) => void
}

export function FilterSidebar({ filters, onFiltersChange }: FilterSidebarProps) {
  const [localFilters, setLocalFilters] = useState<DashboardFilters>(filters)
  const { data: projects } = trpc.projects.list.useQuery()

  const statusOptions = [
    { value: 'proposing', label: 'Proposing' },
    { value: 'approved', label: 'Approved' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'review', label: 'Review' },
    { value: 'applied', label: 'Applied' },
    { value: 'archived', label: 'Archived' },
  ]

  const handleApplyFilters = () => {
    onFiltersChange(localFilters)
  }

  const handleReset = () => {
    const resetFilters: DashboardFilters = {}
    setLocalFilters(resetFilters)
    onFiltersChange(resetFilters)
  }

  const handleStatusToggle = (status: string, checked: boolean) => {
    const currentStatuses = localFilters.status || []
    const newStatuses = checked
      ? [...currentStatuses, status]
      : currentStatuses.filter((s) => s !== status)

    setLocalFilters({ ...localFilters, status: newStatuses.length > 0 ? newStatuses : undefined })
  }

  const handlePriorityChange = (value: number[]) => {
    setLocalFilters({ ...localFilters, priority: [value[0]!, value[1]!] })
  }

  const handleSearchChange = (value: string) => {
    setLocalFilters({ ...localFilters, search: value || undefined })
  }

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      setLocalFilters({ ...localFilters, dateRange: { from: range.from, to: range.to } })
    } else {
      setLocalFilters({ ...localFilters, dateRange: undefined })
    }
  }

  return (
    <div className="w-80 border-r bg-card p-4 space-y-6 overflow-auto">
      <div>
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
      </div>

      {/* Project Filter */}
      <div className="space-y-2">
        <Label>Project</Label>
        <Select
          value={localFilters.projectId?.toString() || '1'}
          onValueChange={(value) =>
            setLocalFilters({ ...localFilters, projectId: parseInt(value) })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            {projects?.map((project) => (
              <SelectItem key={project.id} value={project.id.toString()}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status Filter */}
      <div className="space-y-2">
        <Label>Status</Label>
        <div className="space-y-2">
          {statusOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={option.value}
                checked={localFilters.status?.includes(option.value) || false}
                onCheckedChange={(checked) =>
                  handleStatusToggle(option.value, checked as boolean)
                }
              />
              <label
                htmlFor={option.value}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {option.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Priority Filter */}
      <div className="space-y-2">
        <Label>Priority Range</Label>
        <div className="pt-2">
          <Slider
            min={1}
            max={5}
            step={1}
            value={localFilters.priority || [1, 5]}
            onValueChange={handlePriorityChange}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>{localFilters.priority?.[0] || 1}</span>
            <span>{localFilters.priority?.[1] || 5}</span>
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="space-y-2">
        <Label>Date Range</Label>
        <DateRangePicker
          value={
            localFilters.dateRange
              ? { from: localFilters.dateRange.from, to: localFilters.dateRange.to }
              : undefined
          }
          onChange={handleDateRangeChange}
          placeholder="Select date range"
        />
      </div>

      {/* Search */}
      <div className="space-y-2">
        <Label>Search</Label>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search specs..."
            value={localFilters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <Button onClick={handleApplyFilters} className="w-full">
          Apply Filters
        </Button>
        <Button onClick={handleReset} variant="outline" className="w-full">
          <X className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>
    </div>
  )
}
