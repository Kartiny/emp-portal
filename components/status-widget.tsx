'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function floatToTimeString(floatVal: number | null): string {
  if (floatVal == null || isNaN(floatVal)) return '-';
  const hours = Math.floor(floatVal);
  const minutes = Math.round((floatVal - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

type AttnRecord = {
  datetime: string;
  attn_type: string;
};

type TodayData = {
  records?: AttnRecord[];
  gracePeriod?: any;
  checkInStatus?: string;
  mealCheckOutStatus?: string;
  mealCheckInStatus?: string;
  checkOutStatus?: string;
  checkInMins?: number;
  mealCheckOutMins?: number;
  mealCheckInMins?: number;
  checkOutMins?: number;
};

type ShiftInfo = {
  start?: string | null;
  end?: string | null;
};

export default function StatusWidget({ today, shift }: { today?: TodayData | null; shift?: ShiftInfo | null }) {
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

  const records: AttnRecord[] = today?.records || [];
  const ins = records
    .filter((r: AttnRecord) => r.attn_type === 'i')
    .sort((a: AttnRecord, b: AttnRecord) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  const outs = records
    .filter((r: AttnRecord) => r.attn_type === 'o')
    .sort((a: AttnRecord, b: AttnRecord) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

  const checkInTime = ins[0]?.datetime || null;
  const mealOutTime = outs[0]?.datetime || null;
  const mealInTime = ins[1]?.datetime || null;
  const checkOutTime = outs[outs.length - 1]?.datetime || null;

  const shiftStart = shift?.start ? parseFloat(shift.start.split(':')[0]!) + parseFloat(shift.start.split(':')[1]!) / 60 : null;
  const shiftEnd = shift?.end ? parseFloat(shift.end.split(':')[0]!) + parseFloat(shift.end.split(':')[1]!) / 60 : null;
  
  const mealOutSched = today?.gracePeriod?.meal_check_out as number | undefined;
  const mealInSched = today?.gracePeriod?.meal_check_in as number | undefined;

  // Fallback computed statuses (old logic)
  const computedCheckIn = getStatus(checkInTime, shiftStart, today?.gracePeriod?.grace_period_late_in, 'in');
  const computedMealOut = getStatus(mealOutTime, mealOutSched ?? null, 0, 'out');
  const computedMealIn = getStatus(mealInTime, mealInSched ?? null, 0, 'in');
  const computedCheckOut = getStatus(checkOutTime, shiftEnd, today?.gracePeriod?.grace_period_early_out, 'out');

  // New: Prefer precomputed values from API (as used in attendance page)
  const checkInText = today?.checkInStatus ?? computedCheckIn.text;
  const mealOutText = today?.mealCheckOutStatus ?? computedMealOut.text;
  const mealInText = today?.mealCheckInStatus ?? computedMealIn.text;
  const checkOutText = today?.checkOutStatus ?? computedCheckOut.text;

  // Color logic aligned with attendance page
  const checkInColor = today?.checkInMins && today.checkInMins > 0 ? 'text-yellow-600' : 'text-green-600';
  const mealOutColor = today?.mealCheckOutMins && today.mealCheckOutMins !== 0
    ? (today.mealCheckOutMins > 0 ? 'text-yellow-600' : 'text-green-600')
    : 'text-green-600';
  const mealInColor = today?.mealCheckInMins && today.mealCheckInMins !== 0
    ? (today.mealCheckInMins > 0 ? 'text-yellow-600' : 'text-green-600')
    : 'text-green-600';
  const checkOutColor = today?.checkOutMins && today.checkOutMins > 0 ? 'text-yellow-600' : 'text-green-600';

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Status Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <p>Check-in Status:</p>
          <p className={today?.checkInStatus ? checkInColor : computedCheckIn.color}>{checkInText}</p>
        </div>
        <div className="flex justify-between items-center">
          <p>Meal Check Out Status:</p>
          <p className={today?.mealCheckOutStatus ? mealOutColor : computedMealOut.color}>{mealOutText}</p>
        </div>
        <div className="flex justify-between items-center">
          <p>Meal Check In Status:</p>
          <p className={today?.mealCheckInStatus ? mealInColor : computedMealIn.color}>{mealInText}</p>
        </div>
        <div className="flex justify-between items-center">
          <p>Check-out Status:</p>
          <p className={today?.checkOutStatus ? checkOutColor : computedCheckOut.color}>{checkOutText}</p>
        </div>
      </CardContent>
    </Card>
  );
}