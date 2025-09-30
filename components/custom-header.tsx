import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ListTodo, LogOut } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRole } from '../context/RoleContext';

interface UserProfile {
  name: string;
  email: string;
  image?: string;
}

interface Company {
  id: number;
  name: string;
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
  const [companies, setCompanies] = useState<Company[]>([]);
  const { roles, selectedCompanyId, setSelectedCompanyId } = useRole();

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

    // Fetch companies if user has multiple roles
    if (roles.length > 1) {
      fetch('/api/odoo/company')
        .then(res => res.json())
        .then(data => {
          if (data.companies) {
            setCompanies(data.companies);
            // If no company is selected, default to the first one
            if (selectedCompanyId === undefined && data.companies.length > 0) {
              setSelectedCompanyId(data.companies[0].id);
            }
          }
        })
        .catch(console.error);
    }
  }, [roles, selectedCompanyId, setSelectedCompanyId]);

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

  const handleCompanyChange = (companyIdStr: string) => {
    setSelectedCompanyId(Number(companyIdStr));
  };

  return (
    <div className="w-full bg-white">
      <div className="w-full flex h-full items-center justify-between">
        {/* Left: Avatar + Hi, Name */}
        <div className="flex items-center space-x-2 lg:space-x-3">
          <Link href="/profile" className="flex items-center">
            <Avatar className="h-8 w-8 lg:h-9 lg:w-9 mr-2">
              {!isLoading && profile?.image ? (
                <AvatarImage src={profile.image} alt={profile.name || 'User'} />
              ) : null}
              <AvatarFallback>
                {getInitials(profile?.name || '')}
              </AvatarFallback>
            </Avatar>
          </Link>
          <span className="text-sm lg:text-lg font-semibold hidden sm:inline">
            Hi, {profile?.name || 'User'}
          </span>
          <span className="text-sm lg:text-lg font-semibold sm:hidden">
            {profile?.name || 'User'}
          </span>
        </div>

        {/* Right: Tasks, Logo, Activities, Role Switcher */}
        <div className="flex items-center space-x-2 lg:space-x-6">
          {/* Company Selector - Hidden on mobile */}
          {roles.length > 1 && companies.length > 0 && (
            <div className="hidden md:block">
              <Select onValueChange={handleCompanyChange} value={selectedCompanyId ? String(selectedCompanyId) : ''}>
                <SelectTrigger className="w-[140px] lg:w-[180px]">
                  <SelectValue placeholder="Select Company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={String(company.id)}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Activities - Hidden on small mobile */}
          <div className="hidden sm:block">
            <Popover open={showActivities} onOpenChange={(open) => {
              setShowActivities(open);
              if (open) fetchActivities();
            }}>
              <PopoverTrigger asChild>
                <button title="Activities" className="hover:text-blue-600 transition-colors relative">
                  <ListTodo className="h-5 w-5 lg:h-6 lg:w-6" />
                  {activities.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 lg:h-3 lg:w-3 rounded-full bg-blue-500 border-2 border-white" />
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72">
                <div className="font-semibold mb-2">Your Activities</div>
                {activitiesLoading ? (
                  <div className="text-center py-2">Loading...</div>
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
          </div>

          {/* Logout */}
          <button
            title="Logout"
            className="hover:text-red-600 transition-colors flex items-center gap-1"
            onClick={() => {
              localStorage.clear();
              window.location.href = '/login';
            }}
          >
            <LogOut className="h-5 w-5 lg:h-6 lg:w-6" />
            <span className="hidden lg:inline">Logout</span>
          </button>

          {/* Logo */}
          <Image
            src="/logo.png"
            alt="KPRJ Logo"
            width={40}
            height={40}
            className="rounded-lg ml-2 lg:w-[60px] lg:h-[60px]"
          />
        </div>
      </div>
    </div>
  );
}