import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertTriangle, ListTodo, MessageCircle, LogOut } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { useRole } from '../context/RoleContext';

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
  const [showActivities, setShowActivities] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const { roles } = useRole();

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

  const fetchActivities = async () => {
    setActivitiesLoading(true);
    try {
      const uid = localStorage.getItem('uid');
      if (!uid) return;
      const res = await fetch('/api/odoo/auth/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: Number(uid) }),
      });
      const data = await res.json();
      setActivities(data.activities || []);
    } catch (err) {
      setActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="w-full bg-white border-b">
      <div className="max-w-screen-xl mx-auto w-full flex h-20 items-center justify-between px-8">
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
        {/* Right: Warning, Tasks, Notifications, Logo, Activities, Role Switcher */}
      <div className="flex items-center space-x-6">
        {missedClockOut ? (
          <Popover open={showMissedPopover} onOpenChange={setShowMissedPopover}>
            <PopoverTrigger asChild>
              <button title="Missed Clock Out" className="relative transition-colors" onClick={() => setShowMissedPopover(true)}>
                <AlertTriangle className="h-6 w-6 text-red-600 animate-pulse" />
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 border-2 border-white animate-ping" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 text-sm text-red-900 bg-red-50 border-red-400">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <span>You missed your clock out for today! Please update your attendance.</span>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <span title="No missed clock out" className="relative">
            <AlertTriangle className="h-6 w-6 text-gray-400" />
          </span>
        )}
        <Popover open={showActivities} onOpenChange={(open) => {
          setShowActivities(open);
          if (open) fetchActivities();
        }}>
          <PopoverTrigger asChild>
            <button title="Activities" className="hover:text-blue-600 transition-colors relative">
              <ListTodo className="h-6 w-6" />
              {activities.length > 0 && (
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-blue-500 border-2 border-white" />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72">
            <div className="font-semibold mb-2">Your Activities</div>
            {activitiesLoading ? (
              <div>Loading...</div>
            ) : activities.length === 0 ? (
              <div className="text-muted-foreground">No activities found.</div>
            ) : (
              <ul className="space-y-1">
                {activities.map((a) => (
                  <li key={a.id} className="border-b last:border-b-0 py-1">
                    <span className="font-medium">{a.activity_type_name}</span>
                    {a.summary && <span className="ml-2 text-xs text-muted-foreground">{a.summary}</span>}
                    {a.date_deadline && <span className="ml-2 text-xs text-blue-600">{a.date_deadline}</span>}
                  </li>
                ))}
              </ul>
            )}
          </PopoverContent>
        </Popover>
        <button title="Chat" className="hover:text-blue-600 transition-colors" onClick={() => alert('Open chat!')}>
          <MessageCircle className="h-6 w-6" />
        </button>
        <button
          title="Logout"
          className="hover:text-red-600 transition-colors flex items-center gap-1"
          onClick={() => {
            localStorage.clear();
            window.location.href = '/login';
          }}
        >
          <LogOut className="h-6 w-6" />
          <span className="hidden md:inline">Logout</span>
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
    </div>
  );
} 