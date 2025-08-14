import RoleProtectedRoute from '../../../components/RoleProtectedRoute';
export default function HRReportsPage() {
  return (
    <RoleProtectedRoute allowedRole="hr">
      <div className="p-8">HR: Reports (placeholder)</div>
    </RoleProtectedRoute>
  );
} 