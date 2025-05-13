// lib/odooXml.ts
import xmlrpc from 'xmlrpc';
import { ODOO_CONFIG } from './config';
import { parseISO, differenceInCalendarDays, format as dfFormat } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const COMMON_ENDPOINT  = `${ODOO_CONFIG.BASE_URL}/xmlrpc/2/common`;
const OBJECT_ENDPOINT  = `${ODOO_CONFIG.BASE_URL}/xmlrpc/2/object`;
const STANDARD_HOURS   = 12;  // for attendance rate (7 AM–7 PM)

/** Promise-wrapped xmlrpc.methodCall */
function xmlRpcCall(client: any, method: string, params: any[]): Promise<any> {
  return new Promise((resolve, reject) => {
    client.methodCall(method, params, (err: any, val: any) =>
      err ? reject(err) : resolve(val)
    );
  });
}

export class OdooClient {
  private common = xmlrpc.createSecureClient({ url: COMMON_ENDPOINT });
  private object = xmlrpc.createSecureClient({ url: OBJECT_ENDPOINT });
  private adminUid: number | null = null;

  /** Log in with user credentials; returns uid */
  async login(email: string, password: string): Promise<number> {
    const uid = await xmlRpcCall(this.common, 'login', [
      ODOO_CONFIG.DB_NAME,
      email,
      password,
    ]);
    if (!uid) throw new Error('Invalid credentials');
    return uid;
  }

  /** Ensure we have an admin session */
  private async authenticateAdmin(): Promise<number> {
    if (this.adminUid) return this.adminUid;
    this.adminUid = await this.login(
      ODOO_CONFIG.ADMIN_USER!,
      ODOO_CONFIG.ADMIN_PWD!
    );
    return this.adminUid;
  }

  /** Generic execute_kw for XML-RPC calls */
  private async execute(
    model: string,
    method: string,
    args: any[] = [],
    kwargs: Record<string, any> = {}
  ): Promise<any> {
    const uid = await this.authenticateAdmin();
    return xmlRpcCall(this.object, 'execute_kw', [
      ODOO_CONFIG.DB_NAME,
      uid,
      ODOO_CONFIG.ADMIN_PWD,
      model,
      method,
      args,
      kwargs,
    ]);
  }

  /**
   * Fetch full user profile by UID, merging res.users + hr.employee.
   * Odoo 17 uses hr.employee.user_id back-relation.
   */
  async getFullUserProfile(uid: number): Promise<any> {
    // 1) Read basic user fields
    const [user] = await this.execute(
      'res.users',
      'read',
      [[uid], ['name', 'login', 'image_1920']]
    );
    if (!user) throw new Error('User not found');

    // 2) Find linked hr.employee record
    const [emp] = await this.execute(
      'hr.employee',
      'search_read',
      [[['user_id', '=', uid]]],
      {
        fields: [
          'id','name','job_title','department_id','work_email','work_phone',
          'mobile_phone','gender','birthday','country_id','place_of_birth',
          'country_of_birth','marital','identification_id','passport_id',
          'bank_account_id','certificate','study_field','study_school',
          'private_street','emergency_contact','emergency_phone','lang'
        ],
        limit: 1
      }
    );
    if (!emp) throw new Error('No employee record linked to this user');

    // 3) Merge and return
    return {
      id: emp.id,
      ...user,
      ...emp
    };
  }

  /**
   * Get today's last clock-in / clock-out for a user UID.
   */
  async getTodayAttendance(uid: number): Promise<{ lastClockIn: string | null; lastClockOut: string | null }> {
    const profile = await this.getFullUserProfile(uid);
    const empId = profile.id;
    const today = new Date().toISOString().slice(0, 10);
    const domain = [
      ['employee_id', '=', empId],
      ['check_in', '>=', `${today} 00:00:00`],
    ];
    const recs: any[] = await this.execute(
      'hr.attendance',
      'search_read',
      [domain],
      { fields: ['check_in', 'check_out'], order: 'check_in desc', limit: 1 }
    );
    const last = recs[0] || {};
    return {
      lastClockIn: last.check_in || null,
      lastClockOut: last.check_out || null,
    };
  }

  /**
   * Fetch attendance over a specified date range.
   */
  async getEmployeeAttendance(
    uid: number,
    range: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom' = 'monthly',
    customDate?: string,
    customRange?: { from: string; to: string }
  ): Promise<{
    totalHours: number;
    rate: number;
    records: { id: number; checkIn: string; checkOut: string; workedHours: number }[];
    dateRange: { start: string; end: string };
  }> {
    const profile = await this.getFullUserProfile(uid);
    const empId = profile.id;

    // Determine start/end dates
    let startDate: Date, endDate: Date;
    if (range === 'custom' && customRange) {
      startDate = parseISO(customRange.from);
      endDate   = parseISO(customRange.to);
    } else {
      const base = parseISO(customDate!);
      switch (range) {
        case 'daily':
          startDate = new Date(base.setHours(0,0,0,0));
          endDate   = new Date(base.setHours(23,59,59,999));
          break;
        case 'weekly': {
          const monday = new Date(base);
          monday.setDate(monday.getDate() - ((monday.getDay()+6)%7));
          startDate = new Date(monday.setHours(0,0,0,0));
          const sunday = new Date(startDate);
          sunday.setDate(sunday.getDate()+6);
          endDate = new Date(sunday.setHours(23,59,59,999));
          break;
        }
        case 'biweekly': {
          const monday = new Date(base);
          monday.setDate(monday.getDate() - ((monday.getDay()+6)%7));
          startDate = new Date(monday.setHours(0,0,0,0));
          const twoWeeks = new Date(startDate);
          twoWeeks.setDate(twoWeeks.getDate()+13);
          endDate = new Date(twoWeeks.setHours(23,59,59,999));
          break;
        }
        case 'monthly':
        default:
          startDate = new Date(base.getFullYear(), base.getMonth(), 1,0,0,0,0);
          endDate   = new Date(base.getFullYear(), base.getMonth()+1, 0,23,59,59,999);
      }
    }

    // Format for Odoo
    const fmt = (d: Date) => `${d.toISOString().slice(0,10)} ${d.toTimeString().slice(0,8)}`;
    const domain = [
      ['employee_id','=', empId],
      ['check_in','>=', fmt(startDate)],
      ['check_in','<=', fmt(endDate)],
    ];
    const raw: any[] = await this.execute(
      'hr.attendance',
      'search_read',
      [domain],
      {
        fields: ['id','check_in','check_out','worked_hours'],
        order: 'check_in asc'
      }
    );

    // Map + totals
    const records = raw.map(r => ({
      id: r.id,
      checkIn: r.check_in,
      checkOut: r.check_out,
      workedHours: r.worked_hours || 0,
    }));
    const totalHours = records.reduce((sum, r) => sum + r.workedHours, 0);
    const days = differenceInCalendarDays(endDate, startDate) + 1;
    const rate = days > 0 ? (totalHours / (days * STANDARD_HOURS)) * 100 : 0;

    return {
      totalHours,
      rate,
      records,
      dateRange: {
        start: startDate.toISOString().slice(0,10),
        end:   endDate.toISOString().slice(0,10),
      },
    };
  }

  /**
   * Clock in – creates a new hr.attendance record for the user.
   */
  async clockIn(uid: number): Promise<number> {
    const profile = await this.getFullUserProfile(uid);
    const empId = profile.id;
    const nowZ = toZonedTime(new Date(), 'Asia/Kuala_Lumpur');
    const stamp = dfFormat(nowZ, 'yyyy-MM-dd HH:mm:ss');
    // @ts-ignore
    const newId: number = await this.execute(
      'hr.attendance',
      'create',
      [{ employee_id: empId, check_in: stamp }]
    );
    return newId;
  }

  /**
   * Clock out – finds the latest open record and writes check_out.
   */
  async clockOut(uid: number): Promise<void> {
    const profile = await this.getFullUserProfile(uid);
    const empId = profile.id;
    const recs: any[] = await this.execute(
      'hr.attendance',
      'search_read',
      [[
        ['employee_id','=', empId],
        ['check_out','=', false]
      ]],
      { fields: ['id'], limit: 1, order: 'check_in desc' }
    );
    if (!recs[0]) throw new Error('No open attendance record found');
    const attendanceId = recs[0].id;
    const nowZ = toZonedTime(new Date(), 'Asia/Kuala_Lumpur');
    const stamp = dfFormat(nowZ, 'yyyy-MM-dd HH:mm:ss');
    await this.execute(
      'hr.attendance',
      'write',
      [[attendanceId], { check_out: stamp }]
    );
  }
}

// Singleton and top‐level helpers
let _client: OdooClient;
export function getOdooClient(): OdooClient {
  return _client ||= new OdooClient();
}

export async function loginToOdoo(email: string, password: string) {
  return getOdooClient().login(email, password);
}
export async function getFullUserProfile(uid: number) {
  return getOdooClient().getFullUserProfile(uid);
}
export async function getTodayAttendance(uid: number) {
  return getOdooClient().getTodayAttendance(uid);
}
export async function getEmployeeAttendance(
  uid: number,
  range: 'daily'|'weekly'|'biweekly'|'monthly'|'custom' = 'monthly',
  customDate?: string,
  customRange?: { from: string; to: string }
) {
  return getOdooClient().getEmployeeAttendance(uid, range, customDate, customRange);
}
export async function clockIn(uid: number) {
  return getOdooClient().clockIn(uid);
}
export async function clockOut(uid: number) {
  return getOdooClient().clockOut(uid);
}
