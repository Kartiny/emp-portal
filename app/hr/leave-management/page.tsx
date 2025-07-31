'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LeaveCalendar from '@/components/leave-calendar';
import LeaveRequests from '@/components/leave-requests';
import LeaveBalances from '@/components/leave-balances';
import LeaveTypes from '@/components/leave-types';
import AccrualPlans from '@/components/accrual-plans';
import PublicHolidays from '@/components/public-holidays';
import MandatoryDays from '@/components/mandatory-days';
import ActivityTypes from '@/components/activity-types';
import HrYears from '@/components/hr-years';

export default function LeaveManagementPage() {
  const [configView, setConfigView] = useState('time-off-types');

  const renderConfigView = () => {
    switch (configView) {
      case 'time-off-types':
        return <LeaveTypes />;
      case 'accrual-plans':
        return <AccrualPlans />;
      case 'public-holidays':
        return <PublicHolidays />;
      case 'mandatory-days':
        return <MandatoryDays />;
      case 'activity-types':
        return <ActivityTypes />;
      case 'hr-years':
        return <HrYears />;
      default:
        return <LeaveTypes />;
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Leave Management</h1>
      <Tabs defaultValue="my-time-off">
        <TabsList>
          <TabsTrigger value="my-time-off">My Time Off</TabsTrigger>
          <TabsTrigger value="management">Management</TabsTrigger>
          <TabsTrigger value="reporting">Reporting</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="my-time-off">
          <LeaveCalendar />
        </TabsContent>

        <TabsContent value="management">
          <div className="flex space-x-4 mb-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Time Off</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>All</DropdownMenuItem>
                <DropdownMenuItem>My Team</DropdownMenuItem>
                <DropdownMenuItem>By Department</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Allocations</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>My Team</DropdownMenuItem>
                <DropdownMenuItem>By Department</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <LeaveRequests />
        </TabsContent>

        <TabsContent value="reporting">
          <div className="flex space-x-4 mb-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">By Employee</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {/* Add employee list here */}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">By Type</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {/* Add leave type list here */}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <LeaveBalances />
        </TabsContent>

        <TabsContent value="configuration">
          <div className="flex space-x-4 mb-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Time Off Types</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setConfigView('time-off-types')}>Time Off Types</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setConfigView('accrual-plans')}>Accrual Plans</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setConfigView('public-holidays')}>Public Holidays</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setConfigView('mandatory-days')}>Mandatory Days</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setConfigView('activity-types')}>Activity Types</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">HR</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setConfigView('hr-years')}>Years</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setConfigView('time-off-types')}>Leave Types</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {renderConfigView()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
