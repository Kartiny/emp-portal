import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertTriangle, ListTodo, Bell } from "lucide-react";

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

    // Fetch user profile from the correct endpoint
    fetch('/api/odoo/auth/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: Number(uid) }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setProfile({
            name: data.user.name,
            email: data.user.work_email || data.user.email || '',
            image: data.user.image_1920 ? `data:image/jpeg;base64,${data.user.image_1920}` : undefined,
          });
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
      {/* Left: Avatar + Hi, Name */}
      <div className="flex items-center space-x-3">
        <Link href="/profile" className="flex items-center">
          <Avatar className="h-9 w-9 mr-2">
            {!isLoading && profile?.image ? (
              <AvatarImage src={profile.image} alt={profile.name || 'User'} />
            ) : null}
            <AvatarFallback>
              {getInitials(profile?.name || '')}
            </AvatarFallback>
          </Avatar>
        </Link>
        <span className="text-lg font-semibold">Hi, {profile?.name || 'User'}</span>
      </div>
      {/* Right: Warning, Tasks, Notifications, Logo */}
      <div className="flex items-center space-x-6">
        <button title="Missed Clock Out" className="hover:text-yellow-600 transition-colors" onClick={() => alert('You have not clocked out today!')}>
          <AlertTriangle className="h-6 w-6" />
        </button>
        <button title="Pending Tasks" className="hover:text-blue-600 transition-colors" onClick={() => alert('View your pending tasks!')}>
          <ListTodo className="h-6 w-6" />
        </button>
        <button title="Notifications" className="hover:text-red-600 transition-colors" onClick={() => alert('View notifications!')}>
          <Bell className="h-6 w-6" />
        </button>
        <Image
          src="/logo.png"
          alt="KPRJ Logo"
          width={60}
          height={60}
          className="rounded-lg ml-2"
        />
      </div>
    </div>
  );
} 