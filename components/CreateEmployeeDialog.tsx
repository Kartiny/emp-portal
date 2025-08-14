
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

interface Company {
  id: number;
  name: string;
}

interface Department {
  id: number;
  name: string;
}

interface CreateEmployeeDialogProps {
  onEmployeeCreated: () => void;
}

export default function CreateEmployeeDialog({ onEmployeeCreated }: CreateEmployeeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    job_title: '',
    work_email: '',
    work_phone: '',
    company_id: '',
    department_id: '',
  });

  useEffect(() => {
    if (isOpen) {
      // Fetch companies and departments when the dialog is opened
      const fetchCompanies = async () => {
        try {
          const response = await fetch('/api/odoo/company');
          const data = await response.json();
          if (response.ok) setCompanies(data.companies);
        } catch (err) {
          console.error('Failed to fetch companies', err);
        }
      };

      const fetchDepartments = async () => {
        try {
          const response = await fetch('/api/odoo/department');
          const data = await response.json();
          if (response.ok) setDepartments(data.departments);
        } catch (err) {
          console.error('Failed to fetch departments', err);
        }
      };

      fetchCompanies();
      fetchDepartments();
    }
  }, [isOpen]);

  const handleValueChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch('/api/odoo/employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...formData,
            name: formData.name || 'Unnamed Employee',
            company_id: Number(formData.company_id),
            department_id: Number(formData.department_id),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create employee.');
      }

      toast.success('Employee created successfully!');
      onEmployeeCreated(); // Callback to refresh the list
      setIsOpen(false); // Close the dialog
      // Reset form
      setFormData({
        name: '',
        job_title: '',
        work_email: '',
        work_phone: '',
        company_id: '',
        department_id: '',
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
        <Button variant="outline">Create</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Employee</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new employee.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right text-xs">
                Name
              </Label>
              <Input id="name" value={formData.name} onChange={(e) => handleValueChange('name', e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="job_title" className="text-right text-xs">
                Job Title
              </Label>
              <Input id="job_title" value={formData.job_title} onChange={(e) => handleValueChange('job_title', e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="work_email" className="text-right text-xs">
                Work Email
              </Label>
              <Input id="work_email" type="email" value={formData.work_email} onChange={(e) => handleValueChange('work_email', e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="work_phone" className="text-right text-xs">
                Work Phone
              </Label>
              <Input id="work_phone" value={formData.work_phone} onChange={(e) => handleValueChange('work_phone', e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="company_id" className="text-right text-xs">
                Company
              </Label>
              <Select onValueChange={(value) => handleValueChange('company_id', value)} value={formData.company_id}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department_id" className="text-right text-xs">
                Department
              </Label>
              <Select onValueChange={(value) => handleValueChange('department_id', value)} value={formData.department_id}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Employee'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
