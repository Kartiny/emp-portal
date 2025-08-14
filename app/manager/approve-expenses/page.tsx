import RoleProtectedRoute from '../../../components/RoleProtectedRoute';
export default function ManagerApproveExpensesPage() {
  return (
    <RoleProtectedRoute allowedRole="manager">
      <div className="p-8">Manager: Approve Expenses (placeholder)</div>
    </RoleProtectedRoute>
  );
} 