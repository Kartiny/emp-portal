import RoleProtectedRoute from '../../../components/RoleProtectedRoute';
export default function ManagerProfilePage() {
  return (
    <RoleProtectedRoute allowedRole="manager">
      <div className="p-8">Manager: Profile (placeholder)</div>
    </RoleProtectedRoute>
  );
} 