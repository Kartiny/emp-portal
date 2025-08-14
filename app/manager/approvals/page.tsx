
"use client";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchIcon, XIcon } from "lucide-react";
import LeaveRequestsTable from "./leave-requests-table";
import ExpenseClaimsTable from "./expense-claims-table";

export default function ApprovalsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Pending");

  const pendingLeaveRequests = 5;
  const pendingExpenseClaims = 3;
  const totalPending = pendingLeaveRequests + pendingExpenseClaims;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Approvals</h1>
        {totalPending > 0 && (
          <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-white bg-red-600 rounded-full">
            {totalPending}
          </span>
        )}
      </div>

      <Tabs defaultValue="leave-requests" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="leave-requests">
            Leave Requests
            {pendingLeaveRequests > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {pendingLeaveRequests}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="expense-claims">
            Expense Claims
            {pendingExpenseClaims > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {pendingExpenseClaims}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="relative w-full max-w-sm">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="search"
                placeholder="Search by employee or date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchTerm("")}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={statusFilter === "Pending" ? "default" : "outline"}
                onClick={() => setStatusFilter("Pending")}
              >
                Pending
              </Button>
              <Button
                variant={statusFilter === "Approved" ? "default" : "outline"}
                onClick={() => setStatusFilter("Approved")}
              >
                Approved
              </Button>
              <Button
                variant={statusFilter === "Rejected" ? "default" : "outline"}
                onClick={() => setStatusFilter("Rejected")}
              >
                Rejected
              </Button>
            </div>
          </div>
        </div>
        <TabsContent value="leave-requests">
          <LeaveRequestsTable searchTerm={searchTerm} statusFilter={statusFilter} />
        </TabsContent>
        <TabsContent value="expense-claims">
          <ExpenseClaimsTable searchTerm={searchTerm} statusFilter={statusFilter} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
