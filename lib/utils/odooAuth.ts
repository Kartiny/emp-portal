
import { odooRpc } from './odooRpc';
import { ODOO_CONFIG } from '../config';


export interface AuthResult {
  uid: number;
  session_id: string;
  name: string;
  partner_id: [number, string];
}

export async function loginOdoo(login: string, password: string): Promise<AuthResult> {

  const db = ODOO_CONFIG.DB_NAME;
  return odooRpc<AuthResult>('web/session/authenticate', {
    jsonrpc: '2.0',
    method: 'call',
    params: {
      db,
      login,
      password,
      context: {},
    },
  });
}
