import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertTriangle, ListTodo, Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface UserProfile {
  name: string;
  email: string;
  image?: string;
}

interface CustomHeaderProps {
  missedClockOut?: boolean;
}

export function CustomHeader({ missedClockOut }: CustomHeaderProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMissedPopover, setShowMissedPopover] = useState(false);

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
        {missedClockOut ? (
          <Popover open={showMissedPopover} onOpenChange={setShowMissedPopover}>
            <PopoverTrigger asChild>
              <button title="Missed Clock Out" className="relative transition-colors" onClick={() => setShowMissedPopover(true)}>
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-yellow-500 border-2 border-white animate-pulse" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 text-sm text-yellow-900 bg-yellow-50 border-yellow-400">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <span>You forgot to check out. Please update your time.</span>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <span title="No missed clock out" className="relative">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
          </span>
        )}
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