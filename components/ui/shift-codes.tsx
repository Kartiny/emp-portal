import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ShiftCode {
  id: number;
  name: string;
  time_in: string;
  time_out: string;
}

export function ShiftCodes() {
  const [shiftCodes, setShiftCodes] = useState<ShiftCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShiftCodes = async () => {
      try {
        const response = await fetch('/api/odoo/auth/attendance/shift-codes');
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setShiftCodes(data.shiftCodes || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch shift codes');
      } finally {
        setLoading(false);
      }
    };

    fetchShiftCodes();
  }, []);

  if (loading) {
    return <div>Loading shift codes...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shift Codes</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Time In</TableHead>
              <TableHead>Time Out</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shiftCodes.map((shift) => (
              <TableRow key={shift.id}>
                <TableCell>{shift.name}</TableCell>
                <TableCell>{shift.time_in}</TableCell>
                <TableCell>{shift.time_out}</TableCell>
              </TableRow>
            ))}
            {shiftCodes.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  No shift codes found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 