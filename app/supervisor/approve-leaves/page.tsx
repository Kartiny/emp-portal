import RoleProtectedRoute from '../../../components/RoleProtectedRoute';
export default function SupervisorApproveLeavesPage() {
  return (
    <RoleProtectedRoute allowedRole="supervisor">
      <div className="p-8">Supervisor: Approve Leaves (placeholder)</div>
    </RoleProtectedRoute>
  );
} 