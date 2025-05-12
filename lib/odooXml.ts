// lib/odooXml.ts
import xmlrpc from 'xmlrpc';
import { ODOO_CONFIG } from './config';

const COMMON_ENDPOINT = `${ODOO_CONFIG.BASE_URL}/xmlrpc/2/common`;
const OBJECT_ENDPOINT = `${ODOO_CONFIG.BASE_URL}/xmlrpc/2/object`;

/** Simple promise wrapper around xmlrpc.methodCall */
function xmlRpcCall(client: any, method: string, params: any[]): Promise<any> {
  return new Promise((resolve, reject) => {
    client.methodCall(method, params, (err: any, value: any) => {
      if (err) reject(err);
      else resolve(value);
    });
  });
}

export class OdooClient {
  private common = xmlrpc.createSecureClient({ url: COMMON_ENDPOINT });
  private object = xmlrpc.createSecureClient({ url: OBJECT_ENDPOINT });
  private adminUid: number | null = null;

  /** User login via XML-RPC; returns the UID on success */
  async login(email: string, password: string): Promise<number> {
    const uid = await xmlRpcCall(this.common, 'login', [
      ODOO_CONFIG.DB_NAME,
      email,
      password,
    ]);
    if (!uid) {
      throw new Error('Invalid credentials');
    }
    return uid;
  }

  /** Internal: authenticate as admin for execute_kw calls */
  private async authenticateAdmin(): Promise<number> {
    if (this.adminUid) return this.adminUid;
    this.adminUid = await this.login(
      ODOO_CONFIG.ADMIN_USER,
      ODOO_CONFIG.ADMIN_PWD
    );
    return this.adminUid;
  }

  /** Generic execute_kw wrapper */
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
   * Reads res.users + hr.employee for a given user UID,
   * merges them, and returns a flat object of all fields.
   */
  async getFullUserProfile(uid: number): Promise<Record<string, any>> {
    // 1) Basic user info
    const [user] = await this.execute('res.users', 'read', [
      [uid],
      ['name', 'login', 'image_1920'],
    ]);
    if (!user) {
      throw new Error('User not found');
    }

    // 2) Search the employee linked by user_id
    const [emp] = await this.execute(
      'hr.employee',
      'search_read',
      [[['user_id', '=', uid]]],
      {
        fields: [
          'id',
          'name',
          'image_1920',

          // Work info
          'job_title',
          'department_id',
          'parent_id',
          'work_location_id',
          'work_email',
          'work_phone',
          'mobile_phone',
          'first_contract_date',

          // Personal info
          'gender',
          'birthday',
          'country_id',
          'marital',
          'identification_id',
          'passport_id',
          'bank_account_id',

          // Private Info tab
          'private_street',
          'private_email',
          'private_phone',
          'emergency_contact',
          'emergency_phone',

          // Education & other
          'lang',
          'certificate',
          'study_field',
          'study_school',
        ],
        limit: 1,
      }
    );

    if (!emp) {
      throw new Error('No employee record linked to this user');
    }

    // 3) Combine and return
    return { ...user, ...emp };
  }
}

// Singleton factory
let _client: OdooClient | null = null;
export function getOdooClient(): OdooClient {
  if (!_client) {
    _client = new OdooClient();
  }
  return _client;
}

/** Top-level helper for your login API route */
export async function loginToOdoo(
  email: string,
  password: string
): Promise<number> {
  const client = getOdooClient();
  return client.login(email, password);
}

/** Top-level helper for your profile API route */
export async function getFullUserProfile(uid: number): Promise<Record<string, any>> {
  const client = getOdooClient();
  return client.getFullUserProfile(uid);
}
