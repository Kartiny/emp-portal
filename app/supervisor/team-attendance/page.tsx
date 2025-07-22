import RoleProtectedRoute from '../../../components/RoleProtectedRoute';
export default function SupervisorTeamAttendancePage() {
  return (
    <RoleProtectedRoute allowedRole="supervisor">
      <div className="p-8">Supervisor: Team Attendance (placeholder)</div>
    </RoleProtectedRoute>
  );
} 