'use client';

import * as React from "react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"

export default function EmployeeNavbar() {
  return (
    <div className="flex items-center space-x-4 bg-white p-2 rounded-md shadow-sm">
      {/* Employees Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center">
            Employees <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem asChild>
            <Link href="/hr/employees">Employees</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/hr/contracts">Contracts</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Departments Link */}
      <Button variant="ghost" asChild>
        <Link href="/hr/departments">Departments</Link>
      </Button>

      {/* Employee Groups Link */}
      <Button variant="ghost" asChild>
        <Link href="/hr/employee-groups">Employee Groups</Link>
      </Button>

      {/* Reporting Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center">
            Reporting <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Skill</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Configuration Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center">
            Configuration <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-96 overflow-y-auto">
          <DropdownMenuItem className="py-0.5">Settings</DropdownMenuItem>

          <div className="h-6" /> {/* 1.5rem gap before Employee section */}

          <DropdownMenuItem className="text-blue-600 py-0.5">Employee</DropdownMenuItem>
          <DropdownMenuItem className="py-0.5">Departments</DropdownMenuItem>
          <DropdownMenuItem className="py-0.5">Work Locations</DropdownMenuItem>
          <DropdownMenuItem className="py-0.5">Administrator Work Pattern</DropdownMenuItem>
          <DropdownMenuItem className="py-0.5">Departure Reasons</DropdownMenuItem>
          <DropdownMenuItem className="py-0.5">Skill Types</DropdownMenuItem>
          <DropdownMenuItem className="py-0.5">Tags</DropdownMenuItem>

          <div className="h-6" /> {/* 1.5rem gap before Work Details section */}

          <DropdownMenuItem className="py-0.5">Work Details</DropdownMenuItem>
          <DropdownMenuItem className="py-0.5">Document Type</DropdownMenuItem>
          <DropdownMenuItem className="py-0.5">Job Positions</DropdownMenuItem>
          <DropdownMenuItem className="py-0.5">News</DropdownMenuItem>

          <div className="h-6" /> {/* 1.5rem gap before Resume section */}

          <DropdownMenuItem className="text-blue-600 py-0.5">Resume</DropdownMenuItem>
          <DropdownMenuItem className="py-0.5">Line Types</DropdownMenuItem>

          <div className="h-6" /> {/* 1.5rem gap before Recruitment section */}

          <DropdownMenuItem className="text-blue-600 py-0.5">Recruitment</DropdownMenuItem>
          <DropdownMenuItem className="py-0.5">Job Positions</DropdownMenuItem>
          <DropdownMenuItem className="py-0.5">Employment Types</DropdownMenuItem>

          <div className="h-6" /> {/* 1.5rem gap before Shift Codes section */}

          <DropdownMenuItem className="py-0.5">Shift Codes</DropdownMenuItem>
          <DropdownMenuItem className="py-0.5">Assign Workentry Days</DropdownMenuItem>
          <DropdownMenuItem className="py-0.5">Workentry Day Pattern Guide</DropdownMenuItem>

          <div className="h-6" /> {/* 1.5rem gap before Activity Planning section */}

          <DropdownMenuItem className="text-blue-600 py-0.5">Activity Planning</DropdownMenuItem>
          <DropdownMenuItem className="py-0.5">On/Offboarding Plans</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}