'use client';

import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useEffect, useState } from "react";
import { Skeleton } from "./ui/skeleton";

interface LeaveBalance {
  type: string;
  used: number;
  total: number;
  color: string;
}

export function LeaveBalanceWidget() {
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaveBalances = async () => {
      setIsLoading(true);
      setError(null);
      const uid = localStorage.getItem('uid');

      if (!uid) {
        setError("User ID not found. Please log in again.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/odoo/leave-balance?uid=${uid}`);
        if (!response.ok) {
          throw new Error('Failed to fetch leave balances');
        }
        const data = await response.json();
        setLeaveBalances(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaveBalances();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave Balance</CardTitle>
        <CardDescription>Track your available leave</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-red-500 text-sm">{error}</div>
        ) : (
          <div className="space-y-4">
            {leaveBalances.length > 0 ? leaveBalances.map((leave) => (
              <div key={leave.type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{leave.type}</p>
                  <p className="text-sm text-muted-foreground">
                    {leave.used} / {leave.total} days
                  </p>
                </div>
                <Progress value={(leave.used / leave.total) * 100} className={`h-2 ${leave.color}`} />
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">No leave balances found.</p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Link href="/employee/leave">
          <Button>Apply for Leave</Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

