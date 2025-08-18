'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function floatToTimeString(floatVal: number | null): string {
  if (floatVal == null || isNaN(floatVal)) return '-';
  const hours = Math.floor(floatVal);
  const minutes = Math.round((floatVal - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export default function StatusWidget({ today, shift }) {
  const getStatus = (actualTime: string | null, scheduledTime: number | null, gracePeriod: number = 0, type: 'in' | 'out') => {
    if (!actualTime) return { text: "Missing", color: "text-red-500" };
    if (scheduledTime === null) return { text: "N/A", color: "text-gray-500" };

    const actualDate = new Date(actualTime);
    const actualHour = actualDate.getHours() + actualDate.getMinutes() / 60;

    const diff = actualHour - scheduledTime;

    if (type === 'in') {
      if (diff > gracePeriod) {
        return { text: "Late", color: "text-yellow-500" };
      } else {
        return { text: "On Time", color: "text-green-500" };
      }
    } else { // out
      if (diff < -gracePeriod) {
        return { text: "Early Out", color: "text-yellow-500" };
      } else {
        return { text: "On Time", color: "text-green-500" };
      }
    }
  };

  const records = today?.records || [];
  const ins = records.filter(r => r.attn_type === 'i').sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  const outs = records.filter(r => r.attn_type === 'o').sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

  const checkInTime = ins[0]?.datetime;
  const mealOutTime = outs[0]?.datetime;
  const mealInTime = ins[1]?.datetime;
  const checkOutTime = outs[outs.length - 1]?.datetime;

  const shiftStart = shift?.start ? parseFloat(shift.start.split(':')[0]) + parseFloat(shift.start.split(':')[1]) / 60 : null;
  const shiftEnd = shift?.end ? parseFloat(shift.end.split(':')[0]) + parseFloat(shift.end.split(':')[1]) / 60 : null;
  
  const mealOutSched = today?.gracePeriod?.meal_check_out;
  const mealInSched = today?.gracePeriod?.meal_check_in;

  const checkInStatus = getStatus(checkInTime, shiftStart, today?.gracePeriod?.grace_period_late_in, 'in');
  const mealOutStatus = getStatus(mealOutTime, mealOutSched, 0, 'out');
  const mealInStatus = getStatus(mealInTime, mealInSched, 0, 'in');
  const checkOutStatus = getStatus(checkOutTime, shiftEnd, today?.gracePeriod?.grace_period_early_out, 'out');

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Status Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <p>Check-in Status:</p>
          <p className={checkInStatus.color}>{checkInStatus.text}</p>
        </div>
        <div className="flex justify-between items-center">
          <p>Meal Check Out Status:</p>
          <p className={mealOutStatus.color}>{mealOutStatus.text}</p>
        </div>
        <div className="flex justify-between items-center">
          <p>Meal Check In Status:</p>
          <p className={mealInStatus.color}>{mealInStatus.text}</p>
        </div>
        <div className="flex justify-between items-center">
          <p>Check-out Status:</p>
          <p className={checkOutStatus.color}>{checkOutStatus.text}</p>
        </div>
      </CardContent>
    </Card>
  );
}