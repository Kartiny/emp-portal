import RoleProtectedRoute from '../../../components/RoleProtectedRoute';
export default function HRProfilePage() {
  return (
    <RoleProtectedRoute allowedRole="hr">
      <div className="p-8">HR: Profile (placeholder)</div>
    </RoleProtectedRoute>
  );
} 