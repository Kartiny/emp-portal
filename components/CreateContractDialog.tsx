
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface Employee {
  id: number;
  name: string;
}

interface Department {
  id: number;
  name: string;
}

interface JobPosition {
  id: number;
  name: string;
}

interface WorkingSchedule {
  id: number;
  name: string;
}

interface CreateContractDialogProps {
  onContractCreated: () => void;
}

export default function CreateContractDialog({ onContractCreated }: CreateContractDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([]);
  const [workingSchedules, setWorkingSchedules] = useState<WorkingSchedule[]>([]);

  const [formData, setFormData] = useState({
    employee_id: '',
    name: '',
    department_id: '',
    job_id: '',
    date_start: '',
    date_end: '',
    resource_calendar_id: '',
  });

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const [employeesRes, departmentsRes, jobPositionsRes, workingSchedulesRes] = await Promise.all([
            fetch('/api/odoo/employee').then(res => res.json()),
            fetch('/api/odoo/department').then(res => res.json()),
            fetch('/api/odoo/job-position').then(res => res.json()),
            fetch('/api/odoo/working-schedule').then(res => res.json()),
          ]);

          if (employeesRes.employees) setEmployees(employeesRes.employees);
          if (departmentsRes.departments) setDepartments(departmentsRes.departments);
          if (jobPositionsRes.jobPositions) setJobPositions(jobPositionsRes.jobPositions);
          if (workingSchedulesRes.workingSchedules) setWorkingSchedules(workingSchedulesRes.workingSchedules);

        } catch (err) {
          console.error('Failed to fetch form data', err);
          toast.error('Failed to load form data.');
        }
      };
      fetchData();
    }
  }, [isOpen]);

  const handleValueChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch('/api/odoo/contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...formData,
            employee_id: Number(formData.employee_id),
            department_id: formData.department_id ? Number(formData.department_id) : false,
            job_id: formData.job_id ? Number(formData.job_id) : false,
            resource_calendar_id: Number(formData.resource_calendar_id),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create contract.');
      }

      toast.success('Contract created successfully!');
      onContractCreated(); // Callback to refresh the list
      setIsOpen(false); // Close the dialog
      // Reset form
      setFormData({
        employee_id: '',
        name: '',
        department_id: '',
        job_id: '',
        date_start: '',
        date_end: '',
        resource_calendar_id: '',
      });

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Create Contract</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Contract</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new employee contract.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="employee_id" className="text-right text-xs">
                Employee
              </Label>
              <Select onValueChange={(value) => handleValueChange('employee_id', value)} value={formData.employee_id} required>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => <SelectItem key={emp.id} value={String(emp.id)}>{emp.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right text-xs">
                Contract Reference
              </Label>
              <Input id="name" value={formData.name} onChange={(e) => handleValueChange('name', e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department_id" className="text-right text-xs">
                Department
              </Label>
              <Select onValueChange={(value) => handleValueChange('department_id', value)} value={formData.department_id}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">N/A</SelectItem>
                  {departments.map(dept => <SelectItem key={dept.id} value={String(dept.id)}>{dept.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="job_id" className="text-right text-xs">
                Job Position
              </Label>
              <Select onValueChange={(value) => handleValueChange('job_id', value)} value={formData.job_id}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Job Position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">N/A</SelectItem>
                  {jobPositions.map(job => <SelectItem key={job.id} value={String(job.id)}>{job.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date_start" className="text-right text-xs">
                Start Date
              </Label>
              <Input id="date_start" type="date" value={formData.date_start} onChange={(e) => handleValueChange('date_start', e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date_end" className="text-right text-xs">
                End Date
              </Label>
              <Input id="date_end" type="date" value={formData.date_end} onChange={(e) => handleValueChange('date_end', e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="resource_calendar_id" className="text-right text-xs">
                Working Schedule
              </Label>
              <Select onValueChange={(value) => handleValueChange('resource_calendar_id', value)} value={formData.resource_calendar_id} required>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Working Schedule" />
                </SelectTrigger>
                <SelectContent>
                  {workingSchedules.map(ws => <SelectItem key={ws.id} value={String(ws.id)}>{ws.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Contract'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
