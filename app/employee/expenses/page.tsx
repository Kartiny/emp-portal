'use client';
import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function ExpensesPage() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    description: '',
    date: '',
    payment_mode: '',
    total_amount: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);

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

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReceipt(e.target.files?.[0] || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    const uid = localStorage.getItem('uid');
    if (!uid) {
      console.error('No UID found in localStorage');
      setFormLoading(false);
      return;
    }
    try {
      // 1. Create the expense (without attachment)
      const payload = {
        uid: Number(uid),
        data: {
          description: form.description,
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
      if (!res.ok) {
        const errText = await res.text();
        console.error('Claim submission failed:', errText);
        alert('Failed to submit claim: ' + errText);
        setFormLoading(false);
        return;
      }
      const { id: expenseId } = await res.json();
      // 2. If receipt, upload and link to expense
      if (receipt && expenseId) {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', receipt);
        formData.append('expenseId', String(expenseId));
        const uploadRes = await fetch('/api/odoo/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadJson = await uploadRes.json();
        setUploading(false);
        if (uploadJson.error) {
          console.error('Upload error:', uploadJson.error);
          alert(uploadJson.error);
          setFormLoading(false);
          return;
        }
      }
      // 3. Success
      alert('Expense claim submitted successfully!');
      setDialogOpen(false);
      setForm({
        description: '',
        date: '',
        payment_mode: '',
        total_amount: '',
      });
      setReceipt(null);
      refreshClaims();
    } catch (err) {
      console.error('Error submitting claim:', err);
      alert('Failed to submit claim');
    } finally {
      setFormLoading(false);
    }
  };

  const handleViewInvoice = (claim: any) => {
    setSelectedClaim(claim);
    setInvoiceDialogOpen(true);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center w-full h-[60vh]">
          <p className="text-center">Loading expenses...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header with New Claim Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Expense Claims</h1>
            <p className="text-muted-foreground">Manage your expense claims and reimbursements</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto">
            New Expense Claim
          </Button>
        </div>

        {/* Claims Table */}
        <Card>
          <CardHeader>
            <CardTitle>My Expense Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs lg:text-sm">Date</TableHead>
                    <TableHead className="text-xs lg:text-sm">Description</TableHead>
                    <TableHead className="text-xs lg:text-sm">Payment Mode</TableHead>
                    <TableHead className="text-xs lg:text-sm">Amount</TableHead>
                    <TableHead className="text-xs lg:text-sm">Status</TableHead>
                    <TableHead className="text-xs lg:text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {claims.map((claim) => (
                    <TableRow key={claim.id}>
                      <TableCell className="text-xs lg:text-sm">
                        {claim.date ? format(new Date(claim.date), 'dd/MM/yyyy') : '-'}
                      </TableCell>
                      <TableCell className="text-xs lg:text-sm max-w-[200px] truncate">
                        {claim.description || '-'}
                      </TableCell>
                      <TableCell className="text-xs lg:text-sm">
                        {claim.payment_mode || '-'}
                      </TableCell>
                      <TableCell className="text-xs lg:text-sm">
                        RM {claim.total_amount?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell className="text-xs lg:text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          claim.state === 'approved' ? 'bg-green-100 text-green-800' :
                          claim.state === 'rejected' ? 'bg-red-100 text-red-800' :
                          claim.state === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {claim.state || 'draft'}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs lg:text-sm">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewInvoice(claim)}
                          className="text-xs"
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {claims.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-xs lg:text-sm">
                        No expense claims found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* New Expense Claim Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md lg:max-w-lg">
            <DialogHeader>
              <DialogTitle>New Expense Claim</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Description *</label>
                <Input
                  value={form.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="Enter expense description"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Date *</label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => handleFormChange('date', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Payment Mode *</label>
                <Select value={form.payment_mode} onValueChange={(value) => handleFormChange('payment_mode', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="debit_card">Debit Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Total Amount (RM) *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.total_amount}
                  onChange={(e) => handleFormChange('total_amount', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Receipt (Optional)</label>
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleReceiptChange}
                />
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={formLoading || uploading}>
                  {formLoading ? 'Submitting...' : uploading ? 'Uploading...' : 'Submit Claim'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Invoice Dialog */}
        <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
          <DialogContent className="max-w-md lg:max-w-lg">
            <DialogHeader>
              <DialogTitle>Expense Details</DialogTitle>
            </DialogHeader>
            {selectedClaim && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <p className="text-sm">{selectedClaim.description || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <p className="text-sm">
                    {selectedClaim.date ? format(new Date(selectedClaim.date), 'dd/MM/yyyy') : '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Payment Mode</label>
                  <p className="text-sm">{selectedClaim.payment_mode || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Amount</label>
                  <p className="text-sm font-semibold">RM {selectedClaim.total_amount?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <p className="text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      selectedClaim.state === 'approved' ? 'bg-green-100 text-green-800' :
                      selectedClaim.state === 'rejected' ? 'bg-red-100 text-red-800' :
                      selectedClaim.state === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedClaim.state || 'draft'}
                    </span>
                  </p>
                </div>
                {selectedClaim.attachment_ids && selectedClaim.attachment_ids.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Attachments</label>
                    <div className="space-y-2">
                      {selectedClaim.attachment_ids.map((attachment: any, index: number) => (
                        <div key={index} className="text-sm text-blue-600 hover:underline cursor-pointer">
                          {attachment.name || `Attachment ${index + 1}`}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
} 