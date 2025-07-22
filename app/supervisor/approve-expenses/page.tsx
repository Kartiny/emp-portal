import RoleProtectedRoute from '../../../components/RoleProtectedRoute';
export default function SupervisorApproveExpensesPage() {
  return (
    <RoleProtectedRoute allowedRole="supervisor">
      <div className="p-8">Supervisor: Approve Expenses (placeholder)</div>
    </RoleProtectedRoute>
  );
} 