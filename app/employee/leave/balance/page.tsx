"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/main-layout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";

interface LeaveAllocationUI {
  id: number;
  holiday_status_id: [number, string];
  number_of_days?: number;
  number_of_days_display?: number;
  leaves_taken?: number;
  state?: string;
  date_from?: string;
  date_to?: string;
  manager_id?: [number, string];
  notes?: string;
}

export default function LeaveBalancePage() {
  const [leaveAllocations, setLeaveAllocations] = useState<LeaveAllocationUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const rawUid = localStorage.getItem("uid");
        if (!rawUid) {
          setError("Not logged in");
          return;
        }
        const uid = Number(rawUid);
        const allocations = await fetch("/api/odoo/leave/allocation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid })
        }).then(res => res.json());
        if (allocations.error) throw new Error(allocations.error);
        setLeaveAllocations(allocations.allocations || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load leave allocations");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="history" className="w-full">
        <TabsList>
          <TabsTrigger value="calendar" onClick={() => router.push('/leave')}>Calendar</TabsTrigger>
          <TabsTrigger value="balance" onClick={() => router.push('/leave/balance')}>Leave Balance</TabsTrigger>
          <TabsTrigger value="history" onClick={() => router.push('/leave/history')}>Leave History</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="flex justify-end mb-4">
        <button
          className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 transition-colors"
          onClick={() => router.push('/leave?request=1')}
        >
          Request Leave
        </button>
      </div>
      
      <div className="w-full py-8 px-4">
        {loading ? (
          <div className="text-center py-8">Loading leave allocations...</div>
        ) : error ? (
          <div className="text-center text-red-600 py-8">{error}</div>
        ) : (
          <div className="overflow-x-auto w-full">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Validity Period</TableHead>
                  <TableHead>Allocation</TableHead>
                  <TableHead>Used Days</TableHead>
                  <TableHead>Remaining Days</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveAllocations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">No leave allocations found.</TableCell>
                  </TableRow>
                ) : (
                  leaveAllocations.map((alloc) => (
                    <TableRow key={alloc.id}>
                      <TableCell>{alloc.holiday_status_id?.[1] || '-'}</TableCell>
                      <TableCell>{alloc.date_from ? `${alloc.date_from} - ${alloc.date_to || '-'}` : '-'}</TableCell>
                      <TableCell>{alloc.number_of_days_display ?? alloc.number_of_days ?? '-'}</TableCell>
                      <TableCell>{alloc.leaves_taken ?? '-'}</TableCell>
                      <TableCell>{alloc.number_of_days !== undefined && alloc.leaves_taken !== undefined ? (alloc.number_of_days - alloc.leaves_taken) : '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
} 