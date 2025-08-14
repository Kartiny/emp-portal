
'use client';

import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import CreateEmployeeDialog from './CreateEmployeeDialog';
import { toast } from 'sonner';

interface EmployeeManagementTopbarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  view: 'list' | 'card';
  onViewChange: (view: 'list' | 'card') => void;
  onEmployeeCreated: () => void;
  onDelete: () => void;
  selectedEmployeeCount: number;
  isDeleteDisabled: boolean;
}

export default function EmployeeManagementTopbar({
  searchTerm,
  onSearchChange,
  view,
  onViewChange,
  onEmployeeCreated,
  onDelete,
  selectedEmployeeCount,
  isDeleteDisabled,
}: EmployeeManagementTopbarProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 space-y-2 md:space-y-0">
      <div className="flex items-center space-x-2">
        <CreateEmployeeDialog onEmployeeCreated={onEmployeeCreated} />
        <Button variant="destructive" onClick={onDelete} disabled={isDeleteDisabled}>
          Delete ({selectedEmployeeCount})
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search employees..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full md:w-[200px]"
        />
        <Button variant={view === 'list' ? "secondary" : "ghost"} onClick={() => onViewChange('list')}>List</Button>
        <Button variant={view === 'card' ? "secondary" : "ghost"} onClick={() => onViewChange('card')}>Card</Button>
      </div>
    </div>
  );
}
