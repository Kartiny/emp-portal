import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserProfile {
  name: string;
  email: string;
  image?: string;
}

export function CustomHeader() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const uid = localStorage.getItem('uid');
    if (!uid) {
      setIsLoading(false);
      return;
    }

    // Fetch user profile
    fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: Number(uid) }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setProfile(data.user);
        }
      })
      .catch(console.error)
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="container flex h-20 items-center justify-between px-8">
      <div className="flex items-center space-x-4">
        <span className="text-lg">Hi, {profile?.name || 'User'}</span>
      </div>
      <div className="flex items-center space-x-6">
        <Link href="/profile" className="flex items-center space-x-2">
          <Avatar className="h-8 w-8">
            {!isLoading && profile?.image ? (
              <AvatarImage src={profile.image} alt={profile.name || 'User'} />
            ) : null}
            <AvatarFallback>
              {getInitials(profile?.name || '')}
            </AvatarFallback>
          </Avatar>
        </Link>
      
        <span className="text-sm font-medium">Employee Portal</span>
        <Image
          src="/logo.png"
          alt="KPRJ Logo"
          width={80}
          height={80}
          className="rounded-lg"
        />
      </div>
    </div>
  );
} 