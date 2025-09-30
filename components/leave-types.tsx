
'use client';

import { useState, useEffect } from 'react';

interface LeaveType {
  id: number;
  name: string;
}

export default function LeaveTypes() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        const response = await fetch('/api/odoo/leave/types');
        if (!response.ok) {
          throw new Error('Failed to fetch leave types');
        }
        const data = await response.json();
        setLeaveTypes(data);
      } catch (err) {
        setError((err as any)?.message || 'Failed to fetch leave types');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveTypes();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center w-full py-8 text-center">Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Leave Types</h2>
      <ul>
        {leaveTypes.map((type) => (
          <li key={type.id}>{type.name}</li>
        ))}
      </ul>
    </div>
  );
}
