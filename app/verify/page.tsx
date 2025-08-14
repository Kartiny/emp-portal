'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function VerifyPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // No uid check; always show verification form
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // No uid check

      // For now, use hardcoded verification code '1234'
      if (code === '1234') {
        console.log('✅ Verification successful')
        localStorage.setItem('isVerified', 'true');
        
        // Get primary role from localStorage
        const primaryRole = localStorage.getItem('primaryRole');
        const availableFeatures = JSON.parse(localStorage.getItem('availableFeatures') || '[]');
        const employeeType = localStorage.getItem('employeeType');
        const roles = JSON.parse(localStorage.getItem('userRoles') || '[]');
        
        console.log('🔍 Debug redirect data:');
        console.log('  - primaryRole from localStorage:', primaryRole);
        console.log('  - employeeType from localStorage:', employeeType);
        console.log('  - roles from localStorage:', roles);
        console.log('  - availableFeatures from localStorage:', availableFeatures);
        
        console.log('🎭 Redirecting based on role:', primaryRole, 'with features:', availableFeatures);
        
        // Redirect based on primary role and available features
        if (primaryRole === 'administrator') {
          console.log('✅ Redirecting to administrator dashboard');
          router.push('/administrator/dashboard');
        } else if (primaryRole === 'manager') {
          console.log('✅ Redirecting to manager dashboard');
          router.push('/manager/dashboard');
        } else {
          console.log('⚠️ Defaulting to employee dashboard (primaryRole:', primaryRole, ')');
          router.push('/employee/dashboard');
        }
      } else {
        setError('Invalid verification code')
      }
    } catch (err) {
      console.error('Verification error:', err)
      setError('An error occurred during verification')
    } finally {
      setIsLoading(false)
    }
  }

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
            <CardTitle className="text-2xl flex-1 flex items-center justify-center">Two-Factor Verification</CardTitle>
            <CardDescription className="text-center">
              Please enter the verification code sent to your email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Enter verification code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  className="w-full"
                  disabled={isLoading}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-[#1d1a4e] text-white hover:bg-[#1d1a4e]/90 text-lg py-6"
                disabled={isLoading}
              >
                {isLoading ? 'Verifying...' : 'Verify'}
              </Button>
            </form>
            {error && (
              <div className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
