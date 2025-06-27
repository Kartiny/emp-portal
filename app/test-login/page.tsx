"use client";

import { useEffect, useState } from 'react';
import { loginOdoo, AuthResult } from '@/lib/utils/odooAuth';
import { ODOO_CONFIG } from '@/lib/config';

export default function TestLoginPage() {
  const [info, setInfo] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const res: AuthResult = await loginOdoo(
          ODOO_CONFIG.ADMIN_USER,
          ODOO_CONFIG.ADMIN_PWD
        );
        setInfo(`Logged in as ${res.name} (uid=${res.uid}, partner_id=${res.partner_id[0]})`);
      } catch (e: any) {
        setInfo(`Login failed: ${e.message}`);
      }
    })();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Odoo Login Test</h2>
      <p>{info || 'Logging in…'}</p>
    </div>
  );
}
