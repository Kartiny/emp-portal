import RoleProtectedRoute from '../../../components/RoleProtectedRoute';
export default function HRExpenseManagementPage() {
  return (
    <RoleProtectedRoute allowedRole="hr">
      <div className="p-8">HR: Expense Management (placeholder)</div>
    </RoleProtectedRoute>
  );
} 