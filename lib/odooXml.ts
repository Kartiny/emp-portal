// lib/odooXml.ts
import xmlrpc from 'xmlrpc';
import { ODOO_CONFIG } from './config';
import {
  parseISO,
  differenceInCalendarDays,
  format as dfFormat,
} from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const COMMON_ENDPOINT = `${ODOO_CONFIG.BASE_URL}/xmlrpc/2/common`;
const OBJECT_ENDPOINT = `${ODOO_CONFIG.BASE_URL}/xmlrpc/2/object`;
const STANDARD_HOURS  = 12; // for attendance rate (7 AM–7 PM)

/** Wrapper for xmlrpc.methodCall → Promise */
function xmlRpcCall(client: any, method: string, params: any[]): Promise<any> {
  return new Promise((resolve, reject) => {
    client.methodCall(method, params, (err: any, val: any) =>
      err ? reject(err) : resolve(val)
    );
  });
}

//
// ── TYPES ─────────────────────────────────────────────────────────────────────
//

/** Date range options for attendance queries */
export type DateRange = 'daily'|'weekly'|'biweekly'|'monthly'|'custom';

/** Leave type record */
export interface LeaveType {
  id: number;
  name: string;
  requires_allocation: string;
  virtual_remaining_leaves: number;
  color?: number;
  request_unit: string;
  support_document: boolean;
  unpaid: boolean;
}

/** Leave allocation record */
export interface LeaveAllocation {
  id: number;
  holiday_status_id: [number,string];
  number_of_days: number;
  leaves_taken: number;
}

/** Leave request record */
export interface LeaveRequest {
  id: number;
  holiday_status_id: [number,string];
  request_date_from: string;
  request_date_to:   string;
  number_of_days:    number;
  state:             string;
  name:              string;
  user_id:           [number,string];
  request_hour_from?: number;
  request_hour_to?: number;
}

interface UserProfile {
  name: string;
  email: string;
  image_1920?: string | null;
  job_title: string;
  department: string;
  phone: string;
  // ...other fields
}

//
// ── EXPENSE (CLAIM) MODULE ─────────────────────────────────────────────
//

export interface ExpenseRequest {
  id: number;
  name: string;
  date: string;
  payment_mode: string;
  total_amount: number;
  state: string;
}

//
// ── OdooClient ────────────────────────────────────────────────────────────────
//

export class OdooClient {
  private common = xmlrpc.createSecureClient({ url: COMMON_ENDPOINT });
  private object = xmlrpc.createSecureClient({ url: OBJECT_ENDPOINT });
  private adminUid: number | null = null;

  /** Login as given user/admin */
  async login(email: string, password: string): Promise<number> {
    const uid = await xmlRpcCall(this.common, 'authenticate', [
      ODOO_CONFIG.DB_NAME,
      email,
      password,
      {},
    ]);
    if (!uid) throw new Error('Invalid credentials');
    return uid;
  }

  /** Ensure admin session is available */
  private async authenticateAdmin(): Promise<number> {
    if (this.adminUid) return this.adminUid;
    this.adminUid = await this.login(
      ODOO_CONFIG.ADMIN_USER!,
      ODOO_CONFIG.ADMIN_PWD!
    );
    return this.adminUid;
  }

  /** Generic execute_kw call */
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

  //
  // ── USER PROFILE ────────────────────────────────────────────────────────────
  //

  /** Read res.users + linked hr.employee (Odoo 17 uses hr.employee.user_id) */
  async getFullUserProfile(uid: number): Promise<any> {
    // 1) Basic user
    const [user] = await this.execute(
      'res.users',
      'read',
      [[uid], ['name','login','image_1920']]
    );
    if (!user) throw new Error('User not found');

    // 2) Employee by user_id back-relation
    const [emp] = await this.execute(
      'hr.employee',
      'search_read',
      [[['user_id','=',uid]]],
      {
        fields: [
          'id','name','job_title','department_id','work_email','work_phone',
          'mobile_phone','gender','birthday','country_id','place_of_birth',
          'country_of_birth','marital','identification_id','passport_id',
          'bank_account_id','certificate','study_field','study_school',
          'private_street','emergency_contact','emergency_phone',
          'lang',
          'resource_calendar_id'
        ],
        limit: 1
      }
    );
    if (!emp) throw new Error('No employee record linked to this user');

    return {
      id: emp.id,
      ...user,
      ...emp
    };
  }

  //
  // ── ATTENDANCE ──────────────────────────────────────────────────────────────
  //

  /** Get today's last clock-in/out */
  async getTodayAttendance(uid: number): Promise<{
    lastClockIn: string|null;
    lastClockOut: string|null;
  }> {
    const profile = await this.getFullUserProfile(uid);
    const empId = profile.id;
    const today = new Date().toISOString().slice(0,10);
    const domain = [
      ['employee_id','=',empId],
      ['check_in','>=',`${today} 00:00:00`]
    ];
    const recs: any[] = await this.execute(
      'hr.attendance',
      'search_read',
      [domain],
      { fields:['check_in','check_out'], order:'check_in desc', limit:1 }
    );
    const last = recs[0]||{};
    return {
      lastClockIn: last.check_in||null,
      lastClockOut: last.check_out||null,
    };
  }

  /**
   * Fetch attendance over a range
   * range: daily | weekly | biweekly | monthly | custom
   */
  async getEmployeeAttendance(
    uid: number,
    range: DateRange = 'monthly',
    customDate?: string,
    customRange?: { from: string; to: string }
  ): Promise<{
    totalHours: number;
    rate: number;
    records: { id:number; checkIn:string; checkOut:string; workedHours:number }[];
    dateRange:{ start:string; end:string };
  }> {
    const profile = await this.getFullUserProfile(uid);
    const empId = profile.id;

    // 1) date window
    let startDate:Date, endDate:Date;
    if (range==='custom' && customRange) {
      startDate = parseISO(customRange.from);
      endDate   = parseISO(customRange.to);
    } else {
      const base = parseISO(customDate!);
      switch(range) {
        case 'daily':
          startDate=new Date(base.setHours(0,0,0,0));
          endDate=new Date(base.setHours(23,59,59,999));
          break;
        case 'weekly': {
          const m=new Date(base); m.setDate(m.getDate()-((m.getDay()+6)%7));
          startDate=new Date(m.setHours(0,0,0,0));
          const s=new Date(startDate); s.setDate(s.getDate()+6);
          endDate=new Date(s.setHours(23,59,59,999));
          break;
        }
        case 'biweekly': {
          const m=new Date(base); m.setDate(m.getDate()-((m.getDay()+6)%7));
          startDate=new Date(m.setHours(0,0,0,0));
          const two=new Date(startDate); two.setDate(two.getDate()+13);
          endDate=new Date(two.setHours(23,59,59,999));
          break;
        }
        case 'monthly':
        default:
          startDate=new Date(base.getFullYear(),base.getMonth(),1,0,0,0,0);
          endDate=new Date(base.getFullYear(),base.getMonth()+1,0,23,59,59,999);
      }
    }

    // 2) query
    const fmt = (d:Date)=>`${d.toISOString().slice(0,10)} ${d.toTimeString().slice(0,8)}`;
    const domain = [
      ['employee_id','=',empId],
      ['check_in','>=',fmt(startDate)],
      ['check_in','<=',fmt(endDate)],
    ];
    const raw: any[] = await this.execute(
      'hr.attendance',
      'search_read',
      [domain],
      {
        fields:['id','check_in','check_out','worked_hours'],
        order:'check_in asc'
      }
    );

    // 3) map & aggregate
    const records = raw.map(r=>({
      id:r.id,
      checkIn:r.check_in,
      checkOut:r.check_out,
      workedHours:r.worked_hours||0,
    }));
    const totalHours = records.reduce((sum,r)=>sum+r.workedHours,0);
    const days = differenceInCalendarDays(endDate, startDate)+1;
    const rate = days>0?(totalHours/(days*STANDARD_HOURS))*100:0;

    return {
      totalHours,
      rate,
      records,
      dateRange:{
        start:startDate.toISOString().slice(0,10),
        end:  endDate.toISOString().slice(0,10),
      }
    };
  }

  /** Clock in for a user */
  async clockIn(uid: number): Promise<number> {
    const profile = await this.getFullUserProfile(uid);
    const empId = profile.id;
    const nowZ = toZonedTime(new Date(), 'Asia/Kuala_Lumpur');
    const stamp = dfFormat(nowZ,'yyyy-MM-dd HH:mm:ss');
    // @ts-ignore
    return await this.execute(
      'hr.attendance',
      'create',
      [{ employee_id: empId, check_in: stamp }]
    );
  }

  /** Clock out for a user */
  async clockOut(uid: number): Promise<void> {
    const profile = await this.getFullUserProfile(uid);
    const empId = profile.id;
    const recs: any[] = await this.execute(
      'hr.attendance',
      'search_read',
      [[
        ['employee_id','=',empId],
        ['check_out','=',false]
      ]],
      { fields:['id'], limit:1, order:'check_in desc' }
    );
    if(!recs[0]) throw new Error('No open attendance record found');
    const attendanceId = recs[0].id;
    const nowZ = toZonedTime(new Date(), 'Asia/Kuala_Lumpur');
    const stamp = dfFormat(nowZ,'yyyy-MM-dd HH:mm:ss');
    await this.execute(
      'hr.attendance',
      'write',
      [[attendanceId],{ check_out: stamp }]
    );
  }

  //
  // ── LEAVE MODULE ─────────────────────────────────────────────────────────────
  //

  /** Get all leave types */
  async getLeaveTypes(): Promise<LeaveType[]> {
    const raw: any[] = await this.execute(
      'hr.leave.type',
      'search_read',
      [[]],
      {
        fields:[
          'id','display_name','requires_allocation','virtual_remaining_leaves',
          'color','request_unit','support_document','unpaid'
        ]
      }
    );
    return raw.map(r=>({
      id: r.id,
      name: r.display_name,
      requires_allocation: r.requires_allocation,
      virtual_remaining_leaves: r.virtual_remaining_leaves,
      color: r.color,
      request_unit: r.request_unit,
      support_document: r.support_document,
      unpaid: r.unpaid,
    }));
  }

  /** Get leave allocations for a user */
  async getLeaveAllocations(uid: number): Promise<LeaveAllocation[]> {
    const profile = await this.getFullUserProfile(uid);
    const empId = profile.id;
    const allocations = await this.execute(
      'hr.leave.allocation',
      'search_read',
      [[['employee_id', '=', empId]]],
      {
        fields: [
          'id', 'name', 'holiday_status_id', 'number_of_days_display', 'state', 'date_from', 'date_to',
          'notes', 'manager_id', 'department_id', 'allocation_type', 'max_leaves', 'leaves_taken',
          'duration_display', 'employee_id', 'employee_company_id', 'validation_type', 'type_request_unit',
          'holiday_type', 'accrual_plan_id', 'already_accrued', 'has_accrual_plan', 'active', 'display_name'
          // Add more fields as needed from your JSON
        ],
        order: 'date_from desc'
      }
    );
    return allocations;
  }

  /** Get leave requests with optional filters */
  async getLeaveRequests(
    uid: number,
    filters?:{ year?:number; leaveType?:number; status?:string }
  ): Promise<LeaveRequest[]> {
    const prof = await this.getFullUserProfile(uid);
    const empId = prof.id;
    const domain: any[] = [['employee_id','=',empId]];
    if(filters?.leaveType) domain.push(['holiday_status_id','=',filters.leaveType]);
    if(filters?.status)    domain.push(['state','=',filters.status]);
    if(filters?.year){
      const y=filters.year;
      const start=`${y}-01-01 00:00:00`;
      const end  =`${y}-12-31 23:59:59`;
      domain.push(['request_date_from','>=',start]);
      domain.push(['request_date_to','<=',end]);
    }
    const raw: any[] = await this.execute(
      'hr.leave',
      'search_read',
      [domain],
      {
        fields:[
          'id','holiday_status_id','request_date_from','request_date_to',
          'number_of_days','state','name','user_id'
        ],
        order:'request_date_from desc'
      }
    );
    return raw.map(r=>({
      id: r.id,
      holiday_status_id: r.holiday_status_id,
      request_date_from: r.request_date_from,
      request_date_to:   r.request_date_to,
      number_of_days:    r.number_of_days,
      state:             r.state,
      name:              r.name,
      user_id:           r.user_id,
    }));
  }

  /** Create a new leave request */
  async createLeaveRequest(
    uid: number,
    data: {
      leaveTypeId: number;
      request_date_from: string;
      request_date_to: string;
      reason: string;
      request_unit?: string;
      request_unit_half_day?: string;
      request_unit_hours?: boolean;
      request_hour_from?: string;
      request_hour_to?: string;
      number_of_days_display?: number;
    }
  ): Promise<number> {
    const prof = await this.getFullUserProfile(uid);
    const empId = prof.id;
    const newId: number = await this.execute(
      'hr.leave',
      'create',
      [{
        employee_id: empId,
        holiday_status_id: data.leaveTypeId,
        request_date_from: data.request_date_from,
        request_date_to: data.request_date_to,
        name: data.reason,
        ...(data.request_unit && { request_unit: data.request_unit }),
        ...(data.request_unit_half_day && { request_unit_half_day: data.request_unit_half_day }),
        ...(typeof data.request_unit_hours !== 'undefined' && { request_unit_hours: data.request_unit_hours }),
        ...(data.request_hour_from && { request_hour_from: data.request_hour_from }),
        ...(data.request_hour_to && { request_hour_to: data.request_hour_to }),
        ...(typeof data.number_of_days_display !== 'undefined' && { number_of_days_display: data.number_of_days_display }),
      }]
    );
    return newId;
  }

  /**
   * Fetch the employee's shift code and today's start/end time
   */
  async getEmployeeShiftInfo(uid: number): Promise<{ code: string|null, start: string|null, end: string|null }> {
    const profile = await this.getFullUserProfile(uid);
    const calendar = profile.resource_calendar_id;
    if (!calendar || !Array.isArray(calendar) || !calendar[0]) {
      return { code: null, start: null, end: null };
    }
    const calendarId = calendar[0];
    // Fetch calendar info including code and attendance_ids
    const [calendarData] = await this.execute(
      'resource.calendar',
      'read',
      [[calendarId], ['name', 'attendance_ids']]
    );
    let code = calendarData?.name || null;
    let start: string|null = null;
    let end: string|null = null;
    // Fetch today's attendance line (shift times)
    if (calendarData && Array.isArray(calendarData.attendance_ids) && calendarData.attendance_ids.length > 0) {
      // Fetch all attendance lines
      const attendanceLines = await this.execute(
        'resource.calendar.attendance',
        'read',
        [calendarData.attendance_ids, ['dayofweek', 'hour_from', 'hour_to']]
      );
      // Find today's dayofweek (0=Monday, 6=Sunday in Odoo)
      const today = new Date();
      const jsDay = today.getDay(); // 0=Sunday, 6=Saturday
      const odooDay = jsDay === 0 ? 6 : jsDay - 1; // Odoo: 0=Monday, JS: 0=Sunday
      const todayLines = attendanceLines.filter((l: any) => Number(l.dayofweek) === odooDay);
      if (todayLines.length > 0) {
        // Use the earliest start and latest end for today
        const minFrom = Math.min(...todayLines.map((l: any) => l.hour_from));
        const maxTo = Math.max(...todayLines.map((l: any) => l.hour_to));
        // Format as HH:mm
        start = `${String(Math.floor(minFrom)).padStart(2, '0')}:${String(Math.round((minFrom%1)*60)).padStart(2, '0')}`;
        end = `${String(Math.floor(maxTo)).padStart(2, '0')}:${String(Math.round((maxTo%1)*60)).padStart(2, '0')}`;
      }
    }
    return { code, start, end };
  }

  /**
   * Get all resource.calendar.attendance records with schedule_code_id, hour_from, hour_to
   */
  async getAllShiftAttendances(): Promise<any[]> {
    return await this.execute(
      'resource.calendar.attendance',
      'search_read',
      [[]],
      { fields: ['id', 'schedule_code_id', 'hour_from', 'hour_to'] }
    );
  }

  //
  // ── EXPENSE (CLAIM) MODULE ─────────────────────────────────────────────
  //

  /** Get expense (claim) requests for a user */
  async getExpenseRequests(uid: number): Promise<ExpenseRequest[]> {
    const profile = await this.getFullUserProfile(uid);
    const empId = profile.id;
    const domain = [['employee_id', '=', empId]];
    const raw: any[] = await this.execute(
      'hr.expense',
      'search_read',
      [domain],
      {
        fields: ['id', 'name', 'date', 'payment_mode', 'total_amount', 'state'],
        order: 'date desc'
      }
    );
    return raw.map(r => ({
      id: r.id,
      name: r.name,
      date: r.date,
      payment_mode: r.payment_mode,
      total_amount: r.total_amount,
      state: r.state,
    }));
  }

  /** Create a new expense (claim) request */
  async createExpenseRequest(uid: number, data: { name: string; date: string; payment_mode: string; total_amount: number; }): Promise<number> {
    const profile = await this.getFullUserProfile(uid);
    const empId = profile.id;
    const newId: number = await this.execute(
      'hr.expense',
      'create',
      [{
        employee_id: empId,
        name: data.name,
        date: data.date,
        payment_mode: data.payment_mode,
        total_amount: data.total_amount,
      }]
    );
    return newId;
  }

  /**
   * Fetch all discuss.channel records (channels and direct messages) the user belongs to
   */
  async getDiscussChannels(uid: number): Promise<any[]> {
    // Get the user's partner_id (needed for discuss.channel)
    const [user] = await this.execute(
      'res.users',
      'read',
      [[uid], ['partner_id']]
    );
    if (!user || !user.partner_id) throw new Error('User not found or missing partner_id');
    const partnerId = Array.isArray(user.partner_id) ? user.partner_id[0] : user.partner_id;
    const partnerIdList = [partnerId]; // always wrap in array

    // Find channels the user belongs to
    const channels = await this.execute(
      'discuss.channel',
      'search_read',
      [[['channel_partner_ids', 'in', partnerIdList]]],
      {
        fields: ['id', 'name', 'channel_type', 'channel_partner_ids'],
        order: 'name asc'
      }
    );
    return channels;
  }
}

// ── single instance & top‐level helpers ────────────────────────────────────────
let _client: OdooClient;
export function getOdooClient(): OdooClient {
  return _client ||= new OdooClient();
}

export async function loginToOdoo(email:string,password:string) {
  return getOdooClient().login(email,password);
}
export async function getFullUserProfile(uid:number) {
  return getOdooClient().getFullUserProfile(uid);
}
export async function getTodayAttendance(uid:number) {
  return getOdooClient().getTodayAttendance(uid);
}
export async function getEmployeeAttendance(
  uid:number,range:DateRange='monthly',customDate?:string,customRange?:{from:string;to:string}
) {
  return getOdooClient().getEmployeeAttendance(uid,range,customDate,customRange);
}
export async function clockIn(uid:number) {
  return getOdooClient().clockIn(uid);
}
export async function clockOut(uid:number) {
  return getOdooClient().clockOut(uid);
}
export async function getLeaveTypes() {
  return getOdooClient().getLeaveTypes();
}
export async function getLeaveAllocations(uid:number) {
  return getOdooClient().getLeaveAllocations(uid);
}
export async function getLeaveRequests(
  uid:number,filters?:{year?:number;leaveType?:number;status?:string}
) {
  return getOdooClient().getLeaveRequests(uid,filters);
}
export async function createLeaveRequest(
  uid:number,
  data:{
    leaveTypeId:number;
    request_date_from:string;
    request_date_to:string;
    reason:string;
    request_unit?:string;
    request_unit_half_day?:string;
    request_unit_hours?:boolean;
    request_hour_from?:string;
    request_hour_to?:string;
    number_of_days_display?:number;
  }
) {
  return getOdooClient().createLeaveRequest(uid,data);
}
export async function getEmployeeShiftInfo(uid:number) {
  return getOdooClient().getEmployeeShiftInfo(uid);
}
export async function getAllShiftAttendances() {
  return await getOdooClient().getAllShiftAttendances();
}
export async function getExpenseRequests(uid: number) {
  return getOdooClient().getExpenseRequests(uid);
}
export async function createExpenseRequest(uid: number, data: { name: string; date: string; payment_mode: string; total_amount: number; }) {
  return getOdooClient().createExpenseRequest(uid, data);
}
export async function getDiscussChannels(uid: number) {
  return getOdooClient().getDiscussChannels(uid);
}
