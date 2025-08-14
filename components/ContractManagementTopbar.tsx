'use client';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ContractManagementTopbarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  // onCreateContract: () => void; // This prop will no longer be needed
}

export default function ContractManagementTopbar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  // onCreateContract, // This prop will no longer be needed
}: ContractManagementTopbarProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 space-y-2 md:space-y-0">
      {/* Removed Create Contract Button from here */}
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search contracts..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full md:w-[200px]"
        />
        <Select onValueChange={onStatusFilterChange} value={statusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">New</SelectItem>
            <SelectItem value="open">Running</SelectItem>
            <SelectItem value="close">Expired</SelectItem>
            <SelectItem value="cancel">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}