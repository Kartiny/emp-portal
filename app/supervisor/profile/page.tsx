import RoleProtectedRoute from '../../../components/RoleProtectedRoute';
export default function SupervisorProfilePage() {
  return (
    <RoleProtectedRoute allowedRole="supervisor">
      <div className="p-8">Supervisor: Profile (placeholder)</div>
    </RoleProtectedRoute>
  );
} 