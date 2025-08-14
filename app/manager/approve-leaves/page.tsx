import RoleProtectedRoute from '../../../components/RoleProtectedRoute';
import LeaveRequests from '../../../components/leave-requests';
import LeaveCalendar from '../../../components/leave-calendar';

export default function ManagerApproveLeavesPage() {
  return (
    <RoleProtectedRoute allowedRole="manager">
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Approve Leaves</h1>
        <div className="mb-8">
          <LeaveCalendar />
        </div>
        <LeaveRequests />
      </div>
    </RoleProtectedRoute>
  );
}
 