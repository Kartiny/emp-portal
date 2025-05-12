// lib/odooXml.ts
import xmlrpc from 'xmlrpc';
import { ODOO_CONFIG } from './config';

const COMMON_ENDPOINT = `${ODOO_CONFIG.BASE_URL}/xmlrpc/2/common`;
const OBJECT_ENDPOINT = `${ODOO_CONFIG.BASE_URL}/xmlrpc/2/object`;

function xmlRpcCall(client: any, method: string, params: any[]): Promise<any> {
  return new Promise((resolve, reject) => {
    client.methodCall(method, params, (err: any, value: any) => {
      if (err) return reject(err);
      resolve(value);
    });
  });
}

export class OdooClient {
  private commonClient = xmlrpc.createSecureClient({ url: COMMON_ENDPOINT });
  private objectClient = xmlrpc.createSecureClient({ url: OBJECT_ENDPOINT });
  private adminUid: number | null = null;

  private async authenticateAdmin(): Promise<number> {
    if (this.adminUid) return this.adminUid;
    const uid = await xmlRpcCall(
      this.commonClient,
      'login',
      [ODOO_CONFIG.DB_NAME, ODOO_CONFIG.ADMIN_USER, ODOO_CONFIG.ADMIN_PWD]
    );
    if (!uid) throw new Error('Admin authentication failed');
    this.adminUid = uid;
    return uid;
  }

  private async execute(
    model: string,
    method: string,
    args: any[] = [],
    kwargs: Record<string, any> = {}
  ) {
    const uid = await this.authenticateAdmin();
    return xmlRpcCall(this.objectClient, 'execute_kw', [
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
   * Fetch the merged res.users + hr.employee record for a given user UID
   */
  async getFullUserProfile(uid: number) {
    // 1) Read the basic user fields
    const [user] = await this.execute('res.users', 'read', [
      [uid],
      ['name', 'login', 'image_1920'],
    ]);
    if (!user) {
      throw new Error('User not found');
    }

    // 2) Find the hr.employee record whose user_id is this UID
    const employees = await this.execute(
      'hr.employee',
      'search_read',
      [
        [['user_id', '=', uid]],    // domain
      ],
      {
        fields: [
          'name',
          'job_title',
          'department_id',
          'work_email',
          'work_phone',
          'mobile_phone',
          'gender',
          'birthday',
        
          'marital',
          'identification_id',
          'passport_id',
          'bank_account_id',
          'image_1920',
    
          'lang',
        ],
        limit: 1,
      }
    );

    if (!employees.length) {
      throw new Error('No employee record linked to this user');
    }
    const employee = employees[0];

    // 3) Merge and return
    return {
      ...user,
      ...employee,
    };
  }
}

let _client: OdooClient;
export function getOdooClient() {
  if (!_client) _client = new OdooClient();
  return _client;
}

export async function getFullUserProfile(uid: number) {
  return getOdooClient().getFullUserProfile(uid);
}
