import RoleProtectedRoute from '../../../components/RoleProtectedRoute';
export default function HRAttendanceManagementPage() {
  return (
    <RoleProtectedRoute allowedRole="hr">
      <div className="p-8">HR: Attendance Management (placeholder)</div>
    </RoleProtectedRoute>
  );
} 