'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";



export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRoleButtons, setShowRoleButtons] = useState(false);
  const [pendingEmployeeType, setPendingEmployeeType] = useState<string | null>(null);

  useEffect(() => {
    // No auto-redirect based on uid in localStorage
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    console.log('🔐 Login attempt:', { email, password });

    try {
      console.log('🌐 Making API call to /api/odoo/auth/login');
      const response = await fetch('/api/odoo/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📄 Response data:', data);

      if (response.ok && data.uid) {
        console.log('✅ Login successful, UID:', data.uid);
        // Store user and employee IDs
        localStorage.setItem('uid', data.uid.toString());
        if (data.employeeId) {
          localStorage.setItem('employeeId', data.employeeId.toString());
          localStorage.setItem('employeeName', data.employeeName || '');
          localStorage.setItem('employeeEmail', data.employeeEmail || '');
          localStorage.setItem('jobTitle', data.jobTitle || '');
          console.log('👷 Employee info stored:', {
            employeeId: data.employeeId,
            employeeName: data.employeeName,
            jobTitle: data.jobTitle
          });
        } else {
          console.log('⚠️ No employee record found for user');
          // Clear any existing employee data
          localStorage.removeItem('employeeId');
          localStorage.removeItem('employeeName');
          localStorage.removeItem('employeeEmail');
          localStorage.removeItem('jobTitle');
        }
        // Store employeeType if available
        if (data.employeeType) {
          localStorage.setItem('employeeType', data.employeeType);
        } else {
          localStorage.removeItem('employeeType');
        }
        // Remove any role info
        localStorage.removeItem('primaryRole');
        localStorage.removeItem('userRoles');
        // If HR or Supervisor, show role selection buttons
        if (data.employeeType === 'hr' || data.employeeType === 'supervisor') {
          setShowRoleButtons(true);
          setPendingEmployeeType(data.employeeType);
          setIsLoading(false);
        } else {
          router.push('/verify');
        }
      } else {
        console.log('❌ Login failed:', data.error);
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      console.error('💥 Login error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelect = (role: string) => {
    localStorage.setItem('activeRole', role);
    // Require verification for all roles before dashboard
    router.push('/verify');
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-20 items-center px-8">
          <div className="flex items-center space-x-4">
            <Image
              src="/logo.png"
              alt="KPRJ Logo"
              width={100}
              height={100}
              className="rounded-lg"
            />
          </div>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center bg-gray-50/50">
        <Card className="w-[400px] shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Employee Login</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Username or Email</Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="Enter your username or email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading || showRoleButtons}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading || showRoleButtons}
                />
              </div>
              {error && (
                <div className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}
              <Button 
                type="submit" 
                className="w-full bg-[#1d1a4e] text-white hover:bg-[#1d1a4e]/90 text-lg py-6"
                disabled={isLoading || showRoleButtons}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
            {/* Role selection buttons for HR or Supervisor */}
            {showRoleButtons && (
              <div className="mt-8 space-y-4">
                <div className="text-center font-semibold mb-2">Select Role</div>
                <Button
                  className="w-full text-lg py-6"
                  variant="secondary"
                  onClick={() => handleRoleSelect('employee')}
                >
                  Login as Employee
                </Button>
                {pendingEmployeeType === 'hr' && (
                  <Button
                    className="w-full text-lg py-6"
                    onClick={() => handleRoleSelect('hr')}
                  >
                    Login as HR
                  </Button>
                )}
                {pendingEmployeeType === 'supervisor' && (
                  <Button
                    className="w-full text-lg py-6"
                    onClick={() => handleRoleSelect('supervisor')}
                  >
                    Login as Supervisor
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
