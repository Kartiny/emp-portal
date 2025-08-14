
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from 'date-fns';

interface Contract {
  id: number;
  employee_id: [number, string];
  name: string; // Contract Reference
  department_id: [number, string] | false;
  job_id: [number, string] | false;
  date_start: string;
  date_end: string | false;
  resource_calendar_id: [number, string]; // Working Schedule
  state: 'draft' | 'open' | 'close' | 'cancel'; // Contract Status
}

interface ContractCardProps {
  contract: Contract;
}

export default function ContractCard({ contract }: ContractCardProps) {
  const getContractStatus = (state: string) => {
    switch (state) {
      case 'draft':
        return 'New';
      case 'open':
        return 'Running';
      case 'close':
        return 'Expired';
      case 'cancel':
        return 'Cancelled';
      default:
        return state;
    }
  };

  return (
    <Card className="w-full rounded-lg overflow-hidden shadow-lg bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold">{contract.employee_id[1]}</CardTitle>
        <p className="text-sm text-gray-500">{contract.job_id ? contract.job_id[1] : 'N/A'}</p>
      </CardHeader>
      <CardContent className="text-sm">
        <p><strong>Reference:</strong> {contract.name}</p>
        <p><strong>Department:</strong> {contract.department_id ? contract.department_id[1] : 'N/A'}</p>
        <p><strong>Start Date:</strong> {format(new Date(contract.date_start), 'PPP')}</p>
        <p><strong>End Date:</strong> {contract.date_end ? format(new Date(contract.date_end), 'PPP') : 'N/A'}</p>
        <p><strong>Schedule:</strong> {contract.resource_calendar_id[1]}</p>
        <p><strong>Status:</strong> {getContractStatus(contract.state)}</p>
      </CardContent>
    </Card>
  );
}
