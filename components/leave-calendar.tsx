
'use client';

import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

interface LeaveRequest {
  id: number;
  employee_id: [number, string];
  date_from: string;
  date_to: string;
}

export default function LeaveCalendar() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApprovedLeaves = async () => {
      try {
        const uid = localStorage.getItem('uid');
        if (!uid) {
          setError('User ID not found');
          setLoading(false);
          return;
        }
        const response = await fetch(`/api/odoo/leave/requests?uid=${uid}&status=approved`);
        if (!response.ok) {
          throw new Error('Failed to fetch approved leaves');
        }
        const data = await response.json();
        const formattedEvents = data.map((leave: LeaveRequest) => ({
          title: leave.employee_id && leave.employee_id[1] ? leave.employee_id[1] : 'N/A',
          start: new Date(leave.date_from),
          end: new Date(leave.date_to),
          allDay: true,
        }));
        setEvents(formattedEvents);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchApprovedLeaves();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Leave Calendar</h2>
      <div style={{ height: 500 }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
        />
      </div>
    </div>
  );
}
