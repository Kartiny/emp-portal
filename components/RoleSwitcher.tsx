import { useRole } from '../context/RoleContext';
import { useRouter } from 'next/navigation';

export default function RoleSwitcher() {
  const { roles, activeRole, setActiveRole, isHydrated } = useRole();
  const router = useRouter();

  if (!isHydrated || roles.length <= 1) return null;
  
  return (
    <select
      value={activeRole}
      onChange={e => {
        const role = e.target.value as any;
        setActiveRole(role);
        if (role === 'hr') router.push('/hr/dashboard');
        else if (role === 'supervisor') router.push('/supervisor/dashboard');
        else router.push('/employee/dashboard');
      }}
      className="border rounded px-2 py-1 text-sm"
    >
      {roles.map(role => (
        <option key={role} value={role}>
          {role === 'employee' ? 'Employee Portal' : role === 'hr' ? 'HR Portal' : 'Supervisor Portal'}
        </option>
      ))}
    </select>
  );
} 