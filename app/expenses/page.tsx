'use client';
import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';

export default function ExpensesPage() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    date: '',
    payment_mode: '',
    total_amount: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    refreshClaims();
  }, []);

  const refreshClaims = async () => {
    const uid = localStorage.getItem('uid');
    if (!uid) return;
    setLoading(true);
    const res = await fetch(`/api/odoo/expense?uid=${uid}`);
    const data = await res.json();
    setClaims(data.claims || []);
    setLoading(false);
  };

  const handleFormChange = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    const uid = localStorage.getItem('uid');
    if (!uid) return;
    const payload = {
      uid: Number(uid),
      data: {
        name: form.name,
        date: form.date,
        payment_mode: form.payment_mode,
        total_amount: parseFloat(form.total_amount),
      },
    };
    const res = await fetch('/api/odoo/expense', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setFormLoading(false);
    if (res.ok) {
      setForm({ name: '', date: '', payment_mode: '', total_amount: '' });
      setDialogOpen(false);
      await refreshClaims();
    }
  };

  // Helper for payment mode label
  const paymentModeLabel = (mode: string) => {
    if (mode === 'own_account') return 'Employee';
    if (mode === 'company_account') return 'Company';
    return mode;
  };

  // Helper for state label
  const stateLabel = (state: string) => {
    if (state === 'draft') return 'To Approve';
    if (!state) return '';
    return state.charAt(0).toUpperCase() + state.slice(1);
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">Submit and view your expense (claim) requests</p>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => setDialogOpen(true)}>Apply for Claim</Button>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Expense Claim</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Name</label>
                  <Input value={form.name} onChange={e => handleFormChange('name', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium">Date</label>
                  <Input type="date" value={form.date} onChange={e => handleFormChange('date', e.target.value)} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Payment Mode</label>
                  <Select value={form.payment_mode} onValueChange={v => handleFormChange('payment_mode', v)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company_account">Company Account</SelectItem>
                      <SelectItem value="own_account">Own Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Total Amount (RM)</label>
                  <Input type="number" step="0.01" value={form.total_amount} onChange={e => handleFormChange('total_amount', e.target.value)} required />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={formLoading}>{formLoading ? 'Submitting...' : 'Submit Claim'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        <Card>
          <CardHeader>
            <CardTitle>Your Expense Claims</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-2 py-1 border">Name</th>
                      <th className="px-2 py-1 border">Date</th>
                      <th className="px-2 py-1 border">Payment Mode</th>
                      <th className="px-2 py-1 border">Total Amount(RM)</th>
                      <th className="px-2 py-1 border">State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claims.map((c, i) => (
                      <tr key={c.id || i}>
                        <td className="px-2 py-1 border">{c.name}</td>
                        <td className="px-2 py-1 border">{c.date ? format(new Date(c.date), 'dd-MM-yyyy') : '-'}</td>
                        <td className="px-2 py-1 border">{paymentModeLabel(c.payment_mode)}</td>
                        <td className="px-2 py-1 border">{c.total_amount}</td>
                        <td className="px-2 py-1 border">{stateLabel(c.state)}</td>
                      </tr>
                    ))}
                    {claims.length === 0 && (
                      <tr><td colSpan={5} className="text-center py-2">No claims found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
} 