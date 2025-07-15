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
    // Check if user is logged in
    const uid = localStorage.getItem('uid')
    console.log('🔍 Verify page - checking UID:', uid);
    if (!uid) {
      console.log('❌ No UID found, redirecting to login');
      router.push('/login')
    } else {
      console.log('✅ UID found, staying on verify page');
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const uid = localStorage.getItem('uid')
      if (!uid) {
        router.push('/login')
        return
      }

      // For now, use hardcoded verification code '1234'
      if (code === '1234') {
        console.log('✅ Verification successful')
        localStorage.setItem('isVerified', 'true');
        // Role-based redirect after verification
        const primaryRole = localStorage.getItem('primaryRole') || 'employee';
        switch (primaryRole) {
          case 'admin':
            router.push('/admin/dashboard');
            break;
          case 'hr':
            router.push('/hr/dashboard');
            break;
          default:
            router.push('/employee/dashboard');
            break;
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
