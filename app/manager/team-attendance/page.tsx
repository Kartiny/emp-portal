import RoleProtectedRoute from '../../../components/RoleProtectedRoute';
export default function ManagerTeamAttendancePage() {
  return (
    <RoleProtectedRoute allowedRole="manager">
      <div className="p-8">Manager: Team Attendance (placeholder)</div>
    </RoleProtectedRoute>
  );
} 