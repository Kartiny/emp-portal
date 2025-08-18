'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';

// Mock data - replace with actual API call
const expenseClaimsData = [
  {
    id: 1,
    employee: { name: 'Alice Johnson', avatar: '/placeholder-user.jpg' },
    department: 'Sales',
    requestType: 'Travel',
    amount: '$250.00',
    status: 'Pending',
    receipts: [{ name: 'Flight_Receipt.pdf', url: '#' }],
    description: 'Flight for client meeting in New York.'
  },
  {
    id: 2,
    employee: { name: 'Bob Williams', avatar: '/placeholder-user.jpg' },
    department: 'Sales',
    requestType: 'Meals',
    amount: '$75.50',
    status: 'Approved',
    receipts: [{ name: 'Dinner_Receipt.jpg', url: '#' }],
    description: 'Dinner with client.'
  },
  {
    id: 3,
    employee: { name: 'Charlie Brown', avatar: '/placeholder-user.jpg' },
    department: 'Marketing',
    requestType: 'Software',
    amount: '$120.00',
    status: 'Rejected',
    receipts: [],
    description: 'New design software subscription.'
  },
];

export default function ExpenseClaimDetailPage() {
  const params = useParams();
  const claimId = parseInt(params.id as string, 10);
  const claim = expenseClaimsData.find(c => c.id === claimId);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'Approved':
        return <Badge className="bg-green-500 text-white">Approved</Badge>;
      case 'Rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (!claim) {
    return <div>Expense claim not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Expense Claim Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center">
            <img src={claim.employee.avatar} alt={claim.employee.name} className="h-12 w-12 rounded-full mr-4" />
            <div>
              <p className="font-semibold">{claim.employee.name}</p>
              <p className="text-sm text-gray-500">{claim.department}</p>
            </div>
          </div>
          <div>
            <p><strong>Expense Type:</strong> {claim.requestType}</p>
            <p><strong>Amount:</strong> {claim.amount}</p>
            <p><strong>Status:</strong> {getStatusBadge(claim.status)}</p>
          </div>
          {claim.description && (
            <div>
              <p><strong>Description:</strong></p>
              <p>{claim.description}</p>
            </div>
          )}
          {claim.receipts.length > 0 && (
            <div>
              <strong>Receipts:</strong>
              <ul>
                {claim.receipts.map((receipt, i) => (
                  <li key={i}>
                    <a href={receipt.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {receipt.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {claim.status === 'Pending' && (
            <div className="flex space-x-2 pt-4">
              <Button>Approve</Button>
              <Button variant="destructive">Reject</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
