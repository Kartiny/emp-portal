import xmlrpc from 'xmlrpc';
import { ODOO_CONFIG } from './config';
import {
  parseISO,
  differenceInCalendarDays,
  format as dfFormat,
} from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Buffer } from 'buffer';

const COMMON_ENDPOINT = `${ODOO_CONFIG.BASE_URL}/xmlrpc/2/common`;
const OBJECT_ENDPOINT = `${ODOO_CONFIG.BASE_URL}/xmlrpc/2/object`;
const STANDARD_HOURS = 12; 

// Helper to convert float hour to HH:mm string
function floatToTimeString(floatVal: number | null): string | null {
  if (floatVal == null || isNaN(floatVal)) return null;
  const hours = Math.floor(floatVal);
  const minutes = Math.round((floatVal - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Wrapper for xmlrpc.methodCall → Promise- easier with async/await
function xmlRpcCall(client: any, method: string, params: any[]): Promise<any> {
  return new Promise((resolve, reject) => {
    client.methodCall(method, params, (err: any, val: any) =>
      err ? reject(err) : resolve(val)
    );
  });
}

export type DateRange = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';

export interface LeaveType {
  id: number;
  name: string;
  requires_allocation: string;
  virtual_remaining_leaves: number;
  color?: number;
  request_unit: 'day' | 'hour';
  support_document: boolean;
  unpaid: boolean;
}

export interface LeaveAllocation {
  id: number;
  holiday_status_id: [number, string];
  number_of_days: number;
  leaves_taken: number;
  date_from: string;
  date_to: string;
  state: string;
  manager_id?: [number, string];
  department_id?: [number, string];
  allocation_type?: string;
}

export interface LeaveRequest {
  id: number;
  holiday_status_id: [number, string];
  request_date_from: string;
  request_date_to: string;
  number_of_days: number;
  number_of_days_display?: number;
  state: string;
  name: string;
  user_id: [number, string];
  request_unit_hours?: boolean;
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
  resource_calendar_id: [number, string];
  // ...other fields
}

export interface ExpenseRequest {
  id: number;
  name: string;
  date: string;
  payment_mode: string;
  total_amount: number;
  state: string;
  attachment_url?: string | null;
  attachment_mimetype?: string | null;
}

export class OdooClient {
  private common = xmlrpc.createSecureClient({ url: COMMON_ENDPOINT, allow_none: true });
  private object = xmlrpc.createSecureClient({ url: OBJECT_ENDPOINT, allow_none: true });
  private adminUid: number | null = null;

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

  private async authenticateAdmin(): Promise<number> {
    if (this.adminUid) return this.adminUid;
    this.adminUid = await this.login(
      ODOO_CONFIG.ADMIN_USER!,
      ODOO_CONFIG.ADMIN_PWD!
    );
    return this.adminUid;
  }

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

  async searchUserByLogin(login: string): Promise<any[]> {
    return this.execute(
      'res.users',
      'search_read',
      [[['login', '=', login]]],
      { fields: ['login', 'email'], limit: 1 }
    );
  }

  /** Public method to get user profile */
  async getUserProfile(uid: number): Promise<any> {
    return this.getFullUserProfile(uid);
  }

  async getFullUserProfile(uid: number): Promise<any> {
    try {
      console.log('🔍 Getting user profile for UID:', uid);
      
      const userResult = await this.execute('res.users', 'read', [[uid], ['name', 'login', 'image_1920']]);
      console.log('👤 User result:', userResult);
      
      if (!userResult || !userResult[0]) {
        throw new Error(`User with UID ${uid} not found in res.users`);
      }
      const [user] = userResult;

     
      const empResult = await this.execute(
      'hr.employee',
      'search_read',
      [[['user_id', '=', uid]]],
      {
        fields: [
          // 1. Basic Information
          'name',
          'mobile_phone',
          'work_phone',
          'work_email',
          'barcode',
          'gender',
          'birthday',
          'age',
          'place_of_birth',
          'country_of_birth',
          // 2. Work information
          'job_title',
          'department_id',
          'parent_id',
          'expense_manager_id',
          'leave_manager_id',
          'attendance_manager_id',
          'contract_id',
          // 3. Private Information
          'private_street',
          'private_street2',
          'private_zip',
          'private_state_id',
          'country_id',
          'residence_status', // many2one
          // 3.1 Family Status
          'marital',
          'children',
          // 3.2 Emergency
          'emergency_contact',
          'emergency_phone',
          // 3.3 Education
          'certificate',
          'study_field',
          'study_school',
          // 3.4 Work permit
          'visa_no',
          'permit_no',
          'visa_expire',
          'work_permit_expiration_date',
          'has_work_permit',
          // 3.5 Citizenship
          'emp_country',
          'emp_old_ic',
          'identification_id',
          'ssnid',
          'passport_id',
          'passport_exp_date',
        ],
        limit: 1,
      }
    );
      
      console.log('👷 Employee result:', empResult);
      
      if (!empResult || !empResult[0]) {
        throw new Error(`No employee record found for user with UID ${uid}. Please check if the user is linked to an employee record.`);
      }

      const [emp] = empResult;

      const profile = {
      id: emp.id,
      name: user.name,
      email: user.login,
      image_1920: user.image_1920,
      job_title: emp.job_title,
      department: Array.isArray(emp.department_id) ? emp.department_id[1] : '',
      phone: emp.work_phone || emp.mobile_phone,
      resource_calendar_id: emp.resource_calendar_id,
      ...emp,
        residence_status: Array.isArray(emp.residence_status) ? emp.residence_status : null,
      };
      
      console.log('✅ Profile constructed successfully');
      return profile;
    } catch (error) {
      console.error('❌ Error in getFullUserProfile:', error);
      throw error;
    }
  }

  //
  // ── ATTENDANCE ──────────────────────────────────────────────────────────────
  //

  /** Get today's last clock-in/out */
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

  

  /** Clock in for a user */
  async clockIn(uid: number): Promise<number> {
    const profile = await this.getFullUserProfile(uid);
    const empCode = profile.barcode;
    const nowZ = toZonedTime(new Date(), 'Asia/Kuala_Lumpur');
    const stamp = dfFormat(nowZ, 'yyyy-MM-dd HH:mm:ss'); // Odoo standard format
    if (empCode) {
      try {
        const rawRecord = {
          emp_code: empCode,
          datetime: stamp,
          attn_type: 'i',
          job_id: 1,
          machine_id: '127.0.0.1-manual',
          latitude: 12.9716,
          longitude: 77.5946
        };
        console.log('[DEBUG] Attempting to write to hr.attendance.raw:', rawRecord);
        const rawId = await this.execute('hr.attendance.raw', 'create', [rawRecord]);
        console.log('[DEBUG] Write to hr.attendance.raw successful.');
        return rawId;
      } catch (err) {
        console.error('[ERROR] Failed to write to hr.attendance.raw:', err);
        throw err;
      }
    }
    throw new Error('No employee barcode found');
  }

  /** Clock out for a user */
  async clockOut(uid: number): Promise<number> {
    const profile = await this.getFullUserProfile(uid);
    const empCode = profile.barcode;
    const nowZ = toZonedTime(new Date(), 'Asia/Kuala_Lumpur');
    const stamp = dfFormat(nowZ, 'yyyy-MM-dd HH:mm:ss');
    if (empCode) {
      try {
        const rawRecord = {
          emp_code: empCode,
          datetime: stamp,
          attn_type: 'o',
          job_id: 1,
          machine_id: '127.0.0.1-manual',
          latitude: 12.9716,
          longitude: 77.5946
        };
        console.log('[DEBUG] Attempting to write to hr.attendance.raw (clock out):', rawRecord);
        const rawId = await this.execute('hr.attendance.raw', 'create', [rawRecord]);
        console.log('[DEBUG] Write to hr.attendance.raw (clock out) successful.');
        return rawId;
      } catch (err) {
        console.error('[ERROR] Failed to write to hr.attendance.raw (clock out):', err);
        throw err;
      }
    }
    throw new Error('No employee barcode found');
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
        fields: [
          'id',
          'display_name',
          'requires_allocation',
          'virtual_remaining_leaves',
          'color',
          'request_unit',
          'support_document',
          'unpaid',
        ],
        order: 'display_name asc',
      }
    );

    return raw.map(r => ({
      id: r.id,
      name: r.display_name,
      requires_allocation: r.requires_allocation,
      virtual_remaining_leaves: r.virtual_remaining_leaves,
      color: r.color,
      request_unit: r.request_unit as 'day' | 'hour',
      support_document: r.support_document,
      unpaid: r.unpaid,
    }));
  }

  /** Get leave allocations for a user */
  async getLeaveAllocations(uid: number): Promise<LeaveAllocation[]> {
    const profile: any = await this.getFullUserProfile(uid);
    const empId: number = profile.id;
    const raw: any[] = await this.execute(
      'hr.leave.allocation',
      'search_read',
      [[['employee_id', '=', empId]]],
      {
        fields: [
          'id',
          'holiday_status_id',
          'number_of_days',
          'leaves_taken',
          'date_from',
          'date_to',
          'state',
          'manager_id',
          'department_id',
          'allocation_type',
        ],
        order: 'date_from desc',
      }
    );
    return raw.map(a => ({
      id: a.id,
      holiday_status_id: a.holiday_status_id,
      number_of_days: a.number_of_days,
      leaves_taken: a.leaves_taken,
      date_from: a.date_from,
      date_to: a.date_to,
      state: a.state,
      manager_id: a.manager_id,
      department_id: a.department_id,
      allocation_type: a.allocation_type,
    }));
  }

  /** Get leave requests with optional filters */
  async getLeaveRequests(
    uid: number,
    filters?: { year?: number; leaveType?: number; status?: string }
  ): Promise<LeaveRequest[]> {
    const prof: any = await this.getFullUserProfile(uid);
    const empId: number = prof.id;
    const domain: any[] = [['employee_id', '=', empId]];
    if (filters?.leaveType) domain.push(['holiday_status_id', '=', filters.leaveType]);
    if (filters?.status) domain.push(['state', '=', filters.status]);
    if (filters?.year) {
      const y = filters.year;
      const start = `${y}-01-01 00:00:00`;
      const end = `${y}-12-31 23:59:59`;
      domain.push(['request_date_from', '>=', start]);
      domain.push(['request_date_to', '<=', end]);
    }
    const raw: any[] = await this.execute(
      'hr.leave',
      'search_read',
      [domain],
      {
        fields: [
          'id',
          'holiday_status_id',
          'request_date_from',
          'request_date_to',
          'number_of_days',
          'number_of_days_display',
          'state',
          'name',
          'user_id',
          'request_unit_hours',
          'request_hour_from',
          'request_hour_to',
        ],
        order: 'request_date_from desc',
      }
    );
    return raw.map(r => ({
      id: r.id,
      holiday_status_id: r.holiday_status_id,
      request_date_from: r.request_date_from,
      request_date_to: r.request_date_to,
      number_of_days: r.number_of_days,
      number_of_days_display: r.number_of_days_display,
      state: r.state,
      name: r.name,
      user_id: r.user_id,
      request_unit_hours: r.request_unit_hours,
      request_hour_from: r.request_hour_from,
      request_hour_to: r.request_hour_to,
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
      request_unit?: 'day';
      request_unit_half_day?: 'am' | 'pm';
      request_unit_hours?: boolean;
      request_hour_from?: string;
      request_hour_to?: string;
      number_of_days?: number;
      number_of_days_display?: number;
      attachment_id?: number;
    }
  ): Promise<number> {
    const profile: any = await this.getFullUserProfile(uid);
    const empId: number = profile.id;
    const vals: any = {
      employee_id: empId,
      holiday_status_id: data.leaveTypeId,
      date_from: data.request_date_from,
      date_to: data.request_date_to,
      name: data.reason,
    };

    // Day-based or half-day
    if (data.request_unit === 'day') {
      if (data.request_unit_half_day) {
        vals.request_unit = 'half';
        vals.request_unit_half_day = data.request_unit_half_day;
        vals.number_of_days = 0.5;
      } else {
        vals.number_of_days = data.number_of_days != null ? data.number_of_days : 1.0;
      }
    }

    // Hour-based
    if (data.request_unit_hours) {
      vals.request_unit_hours = true;
      const fromFloat = data.request_hour_from
        ? (() => {
            const [h, m] = data.request_hour_from.split(':').map(Number);
            return h + m / 60;
          })()
        : 0.0;
      const toFloat = data.request_hour_to
        ? (() => {
            const [h, m] = data.request_hour_to.split(':').map(Number);
            return h + m / 60;
          })()
        : 0.0;
      vals.request_hour_from = parseFloat(fromFloat.toFixed(2));
      vals.request_hour_to = parseFloat(toFloat.toFixed(2));
      if (data.number_of_days_display != null) {
        vals.number_of_days_display = data.number_of_days_display;
      }
    }

    // Attachment
    if (data.attachment_id) {
      vals.attachment_ids = [[6, 0, [data.attachment_id]]];
    }

    const newId: number = await this.execute('hr.leave', 'create', [vals]);
    return newId;
  }

  /**
   * Fetch the start/end time for code 'S01' from hr.work.schedule.code.line
   */
  async getEmployeeShiftInfo(
    uid: number
  ): Promise<{ schedule_name: string | null; start: string | null; end: string | null }> {
    const profile: any = await this.getFullUserProfile(uid);
    const calendar = profile.resource_calendar_id;
    if (!calendar || !Array.isArray(calendar) || !calendar[0]) {
      return { schedule_name: null, start: null, end: null };
    }
    const calendarId = calendar[0];
    // Get today's dayofweek in Odoo format (0=Monday, 6=Sunday)
    const today = new Date();
    const jsDay = today.getDay(); // 0=Sunday, 6=Saturday
    const odooDay = jsDay === 0 ? 6 : jsDay - 1;
    // Find today's resource.calendar.attendance line
    const attendanceLines = await this.execute(
      'resource.calendar.attendance',
      'search_read',
      [[['calendar_id', '=', calendarId], ['dayofweek', '=', odooDay]]],
      { fields: ['schedule_code_id'], limit: 1 }
    );
    if (!attendanceLines || attendanceLines.length === 0) {
      return { schedule_name: null, start: null, end: null };
    }
    const scheduleCode = attendanceLines[0].schedule_code_id;
    if (!scheduleCode || !Array.isArray(scheduleCode) || !scheduleCode[0]) {
      return { schedule_name: null, start: null, end: null };
    }
    // Fetch the schedule code record with its line_ids and name
    const codeRecord = await this.execute(
      'hr.work.schedule.code',
      'search_read',
      [[['id', '=', scheduleCode[0]]]],
      { fields: ['id', 'name', 'line_ids'], limit: 1 }
    );
    if (!codeRecord || codeRecord.length === 0) {
      return { schedule_name: null, start: null, end: null };
    }
    const schedule_name = codeRecord[0].name;
    const lineIds = codeRecord[0].line_ids;
    if (!lineIds || !Array.isArray(lineIds) || lineIds.length === 0) {
      return { schedule_name, start: null, end: null };
    }
    // Fetch all lines for this code and filter for code = 'S01'
      const codeLines = await this.execute(
        'hr.work.schedule.code.line',
        'search_read',
      [[['id', 'in', lineIds], ['code', '=', 'S01']]],
      { fields: ['start_clock_actual', 'end_clock_actual', 'code'], limit: 1 }
    );
    if (!codeLines || codeLines.length === 0) {
      return { schedule_name, start: null, end: null };
    }
    const start = floatToTimeString(codeLines[0].start_clock_actual);
    const end = floatToTimeString(codeLines[0].end_clock_actual);
    return { schedule_name, start, end };
  }

  /**
   * Get all resource.calendar.attendance records with schedule_code_id, hour_from, hour_to, and code line's start/end clock actual
   */
  async getAllShiftAttendances(): Promise<any[]> {
    const attendances = await this.execute(
      'resource.calendar.attendance',
      'search_read',
      [[]],
      { fields: ['id', 'schedule_code_id', 'hour_from', 'hour_to'] }
    );
    // For each attendance, fetch code line's start/end if schedule_code_id exists
    const results = await Promise.all(attendances.map(async (att: any) => {
      let start: string | null = null;
      let end: string | null = null;
      if (att.schedule_code_id && Array.isArray(att.schedule_code_id) && att.schedule_code_id[0]) {
        const codeLines = await this.execute(
          'hr.work.schedule.code.line',
          'search_read',
          [[['code', '=', att.schedule_code_id[0]]]],
          { fields: ['start_clock_actual', 'end_clock_actual'], limit: 1 }
        );
        if (codeLines && codeLines.length > 0) {
          start = floatToTimeString(codeLines[0].start_clock_actual);
          end = floatToTimeString(codeLines[0].end_clock_actual);
        }
      }
      return {
        ...att,
        start_clock_actual: start,
        end_clock_actual: end,
      };
    }));
    return results;
  }

  //
  // ── EXPENSE (CLAIM) MODULE ────────────────────────────────────────────────────
  //

  /** Get expense (claim) requests for a user */
  async getExpenseRequests(uid: number): Promise<ExpenseRequest[]> {
    const profile: any = await this.getFullUserProfile(uid);
    const empId: number = profile.id;
    const domain = [['employee_id', '=', empId]];
    const raw: any[] = await this.execute(
      'hr.expense',
      'search_read',
      [domain],
      {
        fields: ['id', 'name', 'date', 'payment_mode', 'total_amount', 'state'],
        order: 'date desc',
      }
    );
    // For each expense, fetch the first attachment (if any)
    const withAttachments = await Promise.all(raw.map(async (r) => {
      let attachment_url = null;
      let attachment_mimetype = null;
      const attachments = await this.execute(
        'ir.attachment',
        'search_read',
        [[['res_model', '=', 'hr.expense'], ['res_id', '=', r.id]]],
        { fields: ['id', 'mimetype'], limit: 1 }
      );
      if (attachments && attachments.length > 0) {
        attachment_url = `/api/odoo/attachment/${attachments[0].id}`;
        attachment_mimetype = attachments[0].mimetype;
      }
      return {
        id: r.id,
        name: r.name,
        date: r.date,
        payment_mode: r.payment_mode,
        total_amount: r.total_amount,
        state: r.state,
        attachment_url,
        attachment_mimetype,
      };
    }));
    return withAttachments;
  }

  /** Create a new expense (claim) request */
  async createExpenseRequest(
    uid: number,
    data: { name: string; date: string; payment_mode: string; total_amount: number }
  ): Promise<number> {
    const profile: any = await this.getFullUserProfile(uid);
    const empId: number = profile.id;
    const newId: number = await this.execute('hr.expense', 'create', [
      {
        employee_id: empId,
        name: data.name,
        date: data.date,
        payment_mode: data.payment_mode,
        total_amount: data.total_amount,
      },
    ]);
    return newId;
  }

  /**
   * Fetch all discuss.channel records (channels and direct messages) the user belongs to
   */
  async getDiscussChannels(uid: number): Promise<any[]> {
    const [user] = await this.execute('res.users', 'read', [[uid], ['partner_id']]);
    if (!user || !user.partner_id) throw new Error('User not found or missing partner_id');
    const partnerId = Array.isArray(user.partner_id) ? user.partner_id[0] : user.partner_id;
    const partnerIdList = [partnerId];
    const channels = await this.execute(
      'discuss.channel',
      'search_read',
      [[['channel_partner_ids', 'in', partnerIdList]]],
      {
        fields: ['id', 'name', 'channel_type', 'channel_partner_ids'],
        order: 'name asc',
      }
    );
    return channels;
  }

  public async postMessage(model: string, recordIds: number[], body: string) {
    return this.execute(model, 'message_post', [recordIds, { body }]);
  }

  /**
   * Get all shift codes from hr.work.schedule.code
   */
  async getAllShiftCodes(): Promise<{ id: number; name: string; desc: string }[]> {
    const raw: any[] = await this.execute(
      'hr.work.schedule.code',
      'search_read',
      [[]],
      { fields: ['id', 'name', 'desc'], order: 'name asc' }
    );
    return raw.map(r => ({ id: r.id, name: r.name, desc: r.desc }));
  }

  /**
   * Upload a file as ir.attachment and return the attachment ID (static helper)
   */
  static async uploadAttachment({
    fileBuffer,
    filename,
    mimetype,
    relatedModel = null,
    relatedId = null,
  }: {
    fileBuffer: Buffer;
    filename: string;
    mimetype: string;
    relatedModel?: string | null;
    relatedId?: number | null;
  }): Promise<number> {
    const client = new OdooClient();
    const base64Data = fileBuffer.toString('base64');
    const values: any = {
      name: filename,
      datas: base64Data,
      mimetype,
      res_model: relatedModel,
      res_id: relatedId,
    };
    Object.keys(values).forEach((k) => values[k] == null && delete values[k]);
    const uid = await client.authenticateAdmin();
    const attachmentId = await xmlRpcCall(client.object, 'execute_kw', [
      ODOO_CONFIG.DB_NAME,
      uid,
      ODOO_CONFIG.ADMIN_PWD,
      'ir.attachment',
      'create',
      [values],
    ]);
    return attachmentId;
  }

  /**
   * Fetch the employee's duty roster shift for a given month
   */
  async getMonthlyDutyRosterShift(uid: number, year: number, month: number): Promise<any> {
    const profile = await this.getFullUserProfile(uid);
    const empId = profile.id;
    // Odoo months are 1-based (January = 1)
    const domain = [
      ['employee_id', '=', empId],
      ['year', '=', year],
      ['month', '=', month + 1],
    ];
    // Build day_1 ... day_31 fields
    const dayFields = Array.from({ length: 31 }, (_, i) => `day_${i + 1}`);
    const recs = await this.execute(
      'hr.duty_roster_shift',
      'search_read',
      [domain],
      { fields: ['id', 'employee_id', 'year', 'month', ...dayFields] }
    );
    return recs && recs.length > 0 ? recs[0] : null;
  }

  /**
   * Fetch an ir.attachment by id (public helper for API route)
   */
  async getAttachmentById(id: number): Promise<any> {
    const atts = await this.execute(
      'ir.attachment',
      'read',
      [[id], ['datas', 'mimetype', 'name']]
    );
    return atts && atts.length > 0 ? atts[0] : null;
  }

  /**
   * Fetch mail_activity for the employee (by user id)
   */
  async getEmployeeActivities(uid: number): Promise<any[]> {
    try {
      console.log('🔍 Getting employee activities for UID:', uid);
      
      const activities = await this.execute('mail.activity', 'search_read', 
        [[['user_id', '=', uid]]], 
        {
          fields: [
            'id',
            'activity_type_id',
            'summary',
            'note',
            'date_deadline',
            'state',
            'res_model',
            'res_id',
            'res_name'
          ],
          order: 'date_deadline asc',
          limit: 20
        }
      );
      
      console.log('📋 Employee activities:', activities);
      return activities;
    } catch (error: any) {
      console.error('❌ Error getting employee activities:', error);
      throw error;
    }
  }

  /** Public method to search for employee by user_id */
  async getEmployeeByUserId(uid: number): Promise<any> {
    try {
      console.log('🔍 Searching for employee with user_id:', uid);
      const employees = await this.execute('hr.employee', 'search_read', 
        [[['user_id', '=', uid]]], 
        { fields: ['id', 'name', 'user_id', 'work_email', 'job_title'], limit: 1 }
      );
      
      console.log('👷 Employee search result:', employees);
      
      if (employees && employees.length > 0) {
        return employees[0];
      }
      return null;
    } catch (error: any) {
      console.error('❌ Error searching for employee by user_id:', error);
      throw error;
    }
  }

  /** Public method to get employee barcode by user_id */
  async getEmployeeBarcode(uid: number): Promise<{ id: number; name: string; barcode: string | false } | null> {
    try {
      const employees = await this.execute(
        'hr.employee',
      'search_read',
      [[['user_id', '=', uid]]],
        { fields: ['id', 'name', 'barcode'] }
      );
      
      if (employees && employees.length > 0) {
        return employees[0];
      }
      return null;
    } catch (error: any) {
      console.error('❌ Error getting employee barcode:', error);
      throw error;
    }
  }

  /** Public method to get raw attendance records from hr.attendance.raw */
  async getRawAttendanceRecords(empCode: string, startDate: string, endDate: string): Promise<any[]> {
    try {
      const domain = [
        ['emp_code', '=', empCode],
        ['datetime', '>=', startDate],
        ['datetime', '<=', endDate],
      ];
      
      const records = await this.execute(
        'hr.attendance.raw',
        'search_read',
        [domain],
        { fields: ['id', 'datetime', 'attn_type', 'emp_code'], order: 'datetime asc' }
      );
      
      return records;
    } catch (error: any) {
      console.error('❌ Error getting raw attendance records:', error);
      throw error;
    }
  }

  /** Public method to get shift timings from hr.attendance.raw */
  async getShiftTimingsFromRaw(empCode: string, date: string): Promise<{ start: string | null; end: string | null }> {
    try {
      const domain = [
        ['emp_code', '=', empCode],
        ['datetime', '>=', `${date} 00:00:00`],
        ['datetime', '<=', `${date} 23:59:59`],
      ];
      
      const records = await this.execute(
        'hr.attendance.raw',
        'search_read',
        [domain],
        { 
          fields: ['datetime', 'attn_type', 'emp_code'], 
          order: 'datetime asc'
        }
      );

      // Get first check-in and last check-out of the day
      let firstIn = null;
      let lastOut = null;

      for (const rec of records) {
        if (rec.attn_type === 'i' && !firstIn) {
          firstIn = rec.datetime;
        }
        if (rec.attn_type === 'o') {
          lastOut = rec.datetime;
        }
      }

      return {
        start: firstIn,
        end: lastOut
      };
    } catch (error: any) {
      console.error('❌ Error getting shift timings from raw:', error);
      throw error;
    }
  }

  /** Public method to get attendance sheets for an employee in a date range */
  async getAttendanceSheets(employeeId: number, startDate: string, endDate: string): Promise<any[]> {
    try {
      const domain = [
        ['employee_id', '=', employeeId],
        ['date_from', '<=', endDate],
        ['date_to', '>=', startDate],
      ];
      const records = await this.execute(
        'attendance.sheet',
        'search_read',
        [domain],
        {
          fields: [
            'id',
            'employee_id',
            'date_from',
            'date_to',
            'state',
          ],
          order: 'date_from asc',
        }
      );
      return records;
    } catch (error: any) {
      console.error('❌ Error getting attendance sheets:', error);
      throw error;
    }
  }

  /** Public method to get attendance sheet line records for a sheet in a date range */
  async getAttendanceSheetLineBySheet(sheetId: number, startDate: string, endDate: string): Promise<any[]> {
    try {
      const domain = [
        ['att_sheet_id', '=', sheetId],
        ['date', '>=', startDate],
        ['date', '<=', endDate],
      ];
      const records = await this.execute(
        'attendance.sheet.line',
        'search_read',
        [domain],
        {
          fields: [
            'day',
            'date',
            'ac_sign_in',
            'ac_sign_out',
            'real_overtime',
            'overtime',
            'total_working_time',
            'line_employee_id',
            'att_sheet_id',
          ],
          order: 'date asc',
        }
      );
      return records;
    } catch (error: any) {
      console.error('❌ Error getting attendance sheet line records by sheet:', error);
      throw error;
    }
  }

  /** Public method to get attendance sheet line records for an employee in a date range */
  async getAttendanceSheetLinesByEmployee(empId: number, startDate: string, endDate: string): Promise<any[]> {
    try {
      const domain = [
        ['line_employee_id', '=', empId],
        ['date', '>=', startDate],
        ['date', '<=', endDate],
      ];
      const records = await this.execute(
        'attendance.sheet.line',
        'search_read',
        [domain],
        {
          fields: [
            'day',
            'date',
            'ac_sign_in',
            'ac_sign_out',
            'real_overtime',
            'overtime',
            'total_working_time',
            'line_employee_id',
            'att_sheet_id',
          ],
          order: 'date asc',
        }
      );
      return records;
    } catch (error: any) {
      console.error('❌ Error getting attendance sheet line records by employee:', error);
      throw error;
    }
  }
}

// ── single instance & top‐level helpers ────────────────────────────────────────
let _client: OdooClient;
export function getOdooClient(): OdooClient {
  return (_client ||= new OdooClient());
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

export async function clockIn(uid: number) {
  return getOdooClient().clockIn(uid);
}
export async function clockOut(uid: number) {
  return getOdooClient().clockOut(uid);
}
export async function getLeaveTypes() {
  return getOdooClient().getLeaveTypes();
}
export async function getLeaveAllocations(uid: number) {
  return getOdooClient().getLeaveAllocations(uid);
}
export async function getLeaveRequests(
  uid: number,
  filters?: { year?: number; leaveType?: number; status?: string }
) {
  return getOdooClient().getLeaveRequests(uid, filters);
}
export async function createLeaveRequest(
  uid: number,
  data: {
    leaveTypeId: number;
    request_date_from: string;
    request_date_to: string;
    reason: string;
    request_unit?: 'day';
    request_unit_half_day?: 'am' | 'pm';
    request_unit_hours?: boolean;
    request_hour_from?: string;
    request_hour_to?: string;
    number_of_days?: number;
    number_of_days_display?: number;
    attachment_id?: number;
  }
) {
  return getOdooClient().createLeaveRequest(uid, data);
}
export async function getEmployeeShiftInfo(uid: number) {
  return getOdooClient().getEmployeeShiftInfo(uid);
}
export async function getAllShiftAttendances() {
  return await getOdooClient().getAllShiftAttendances();
}
export async function getExpenseRequests(uid: number) {
  return getOdooClient().getExpenseRequests(uid);
}
export async function createExpenseRequest(
  uid: number,
  data: { name: string; date: string; payment_mode: string; total_amount: number }
) {
  return getOdooClient().createExpenseRequest(uid, data);
}
export async function getDiscussChannels(uid: number) {
  return getOdooClient().getDiscussChannels(uid);
}
export async function getAllShiftCodes() {
  const client = getOdooClient();
  return client.getAllShiftCodes();
}

export async function uploadAttachmentToOdoo(opts: {
  fileBuffer: Buffer;
  filename: string;
  mimetype: string;
  relatedModel?: string | null;
  relatedId?: number | null;
}): Promise<number> {
  return OdooClient.uploadAttachment(opts);
}

export async function getEmployeeByUserId(uid: number) {
  const client = getOdooClient();
  return client.getEmployeeByUserId(uid);
}

