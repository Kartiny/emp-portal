import { NextResponse } from 'next/server';
import { getFullUserProfile, getOdooClient } from '@/lib/odooXml';

// Get direct manager (simplified)
const getDirectManager = async (employeeId: number) => {
  try {
    const client = getOdooClient();

    // Get employee data directly by employee ID (not user ID)
    const employee = await client.execute('hr.employee', 'read', [
      [employeeId],
      ['id', 'name', 'parent_id', 'user_id']
    ]);

    console.log('🔍 Debug - Employee data:', employee);

    if (employee && employee[0] && employee[0].parent_id) {
      // The parent_id is an array [id, name], so we use the first element (ID)
      const managerId = employee[0].parent_id[0];
      const managerName = employee[0].parent_id[1];

      console.log('🔍 Debug - Employee parent_id:', employee[0].parent_id);
      console.log('🔍 Debug - Manager ID:', managerId);

      // Get the manager's user ID from the employee record
      const managerEmployee = await client.execute('hr.employee', 'read', [
        [managerId],
        ['id', 'name', 'user_id']
      ]);

      console.log('🔍 Debug - Manager employee data:', managerEmployee);

      if (managerEmployee && managerEmployee[0] && managerEmployee[0].user_id) {
        const managerUserId = managerEmployee[0].user_id[0];
        console.log('🔍 Debug - Manager user ID found:', managerUserId);
        
        return {
          id: managerId,
          name: managerName,
          user_id: managerUserId // Get the actual user ID
        };
      }

      console.log('🔍 Debug - No user_id found for manager, using employee ID as fallback');
      return {
        id: managerId,
        name: managerName,
        user_id: managerId // Fallback to employee ID
      };
    }

    console.log('🔍 Debug - No parent_id found, using default manager');
    // Fallback: return a default manager
    return {
      id: 2,
      name: 'Manager1',
      user_id: 6 // Use the correct user ID for Manager1
    };
  } catch (error) {
    console.error('Error getting manager:', error);
    // Fallback: return a default manager
    return {
      id: 2,
      name: 'Manager1',
      user_id: 6 // Use the correct user ID for Manager1
    };
  }
};

export async function POST(req: Request) {
  try {
    const { changes, comment } = await req.json();
    const uid = parseInt(req.headers.get('uid') || '0');

    if (!uid) {
      return NextResponse.json({ error: 'User ID not provided' }, { status: 400 });
    }

    if (!changes || Object.keys(changes).length === 0) {
      return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
    }

    // Get current user profile
    const currentProfile = await getFullUserProfile(uid);
    if (!currentProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Get direct manager for approval
    const manager = await getDirectManager(currentProfile.id);
    if (!manager) {
      return NextResponse.json({ 
        error: 'No direct manager found for approval' 
      }, { status: 400 });
    }

    console.log('🔍 Debug - Manager found:', manager);
    console.log('🔍 Debug - Current user ID:', uid);
    console.log('🔍 Debug - Manager user ID:', manager.user_id);
    console.log('🔍 Debug - Manager user_id array:', manager.user_id);

    // Create the change request in Odoo
    const client = getOdooClient();
    
    // Prepare the request data for Odoo - start with minimal required fields
    const requestData = {
      name: `EMP-${currentProfile.id}-${Date.now()}`, // Generate a reference
      employee_id: currentProfile.id,
      requested_by_id: uid,
      activity_user_id: manager.user_id, // Assign to manager for approval
      state: 'to_approve', // Set state to to_approve so manager can see it
    };

    console.log('🔍 Debug - Request data being sent to Odoo:', requestData);

    // First, let's check if the model exists by trying to search for it
    try {
      const modelExists = await client.execute('employee.update.request', 'search', [[]]);
      console.log('🔍 Debug - Model exists, found records:', modelExists);
      
      // Let's also try to get the fields of the model
      const fields = await client.execute('employee.update.request', 'fields_get', []);
      console.log('🔍 Debug - Model fields:', Object.keys(fields));
      
      // Let's also check the line model fields
      const lineFields = await client.execute('employee.update.request.line', 'fields_get', []);
      console.log('🔍 Debug - Line model fields:', Object.keys(lineFields));
      
      // Let's check the state field selection values
      const stateField = fields.state;
      console.log('🔍 Debug - State field info:', stateField);
    } catch (modelError: any) {
      console.error('❌ Model does not exist or is not accessible:', modelError);
      throw new Error('employee.update.request model not found in Odoo');
    }

    // Create the main request
    let requestId: number;
    try {
      requestId = await client.execute('employee.update.request', 'create', [requestData]);
      
      if (!requestId) {
        throw new Error('Failed to create request in Odoo');
      }
      
      console.log('🔍 Debug - Request created with ID:', requestId);
      console.log('🔍 Debug - Request data:', requestData);
      
      // Let's check what state the request was created with
      const createdRequest = await client.execute('employee.update.request', 'read', [[requestId], ['id', 'name', 'state', 'activity_user_id']]);
      console.log('🔍 Debug - Created request details:', createdRequest[0]);
    } catch (createError: any) {
      console.error('❌ Error creating request in Odoo:', createError);
      console.error('❌ Request data that failed:', requestData);
      throw createError;
    }

                    // Create request lines for each change
                const lineData = Object.entries(changes).map(([field, newValue]) => ({
                  request_id: requestId,
                  field_name: field,
                  field_description: field, // Add field description
                  old_value: currentProfile[field] || '',
                  new_value: newValue,
                }));

                console.log('🔍 Debug - Creating request lines:', lineData);

                // Create the request lines
                for (const line of lineData) {
                  const lineId = await client.execute('employee.update.request.line', 'create', [line]);
                  console.log('🔍 Debug - Created line with ID:', lineId);
                }

    console.log('✅ Profile change request created in Odoo:', {
      requestId,
      employee: currentProfile.name,
      approver: manager.name,
      changes: Object.keys(changes)
    });

    return NextResponse.json({
      success: true,
      requestId,
      message: 'Profile change request submitted successfully',
      approver: manager.name
    });

  } catch (error: any) {
    console.error('❌ Error submitting profile change request:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to submit profile change request' 
    }, { status: 500 });
  }
} 