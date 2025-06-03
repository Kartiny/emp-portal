
import { ODOO_CONFIG } from '../config';

export async function odooRpc<T = any>(
  path: string,
  payload: {
    jsonrpc: '2.0';
    method: 'call';
    params: any;
  }
): Promise<T> {
  const url = `${ODOO_CONFIG.BASE_URL}/${path}`;
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include', 
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.data?.message || JSON.stringify(data.error));
  }
  return data.result as T;
}

export async function odooJsonRpc<T = any>(
  model: string,
  method: string,
  args: any[] = [],
  kwargs: Record<string, any> = {}
): Promise<T> {
  return odooRpc<T>('web/dataset/call_kw', {
    jsonrpc: '2.0',
    method: 'call',
    params: { model, method, args, kwargs },
  });
}
