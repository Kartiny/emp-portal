import RoleProtectedRoute from '../../../components/RoleProtectedRoute';
export default function HRLeaveManagementPage() {
  return (
    <RoleProtectedRoute allowedRole="hr">
      <div className="p-8">HR: Leave Management (placeholder)</div>
    </RoleProtectedRoute>
  );
} 