import RoleProtectedRoute from '../../../components/RoleProtectedRoute';
export default function HREmployeesPage() {
  return (
    <RoleProtectedRoute allowedRole="hr">
      <div className="p-8">HR: Manage Employees (placeholder)</div>
    </RoleProtectedRoute>
  );
} 