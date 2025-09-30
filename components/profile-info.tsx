'use client';

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface UserProfile {
  name: string;
  department_id?: [number, string];
  job_id?: [number, string];
  job_title?: string;
  work_email?: string;
  work_phone?: string;
  mobile_phone?: string;
  gender?: string;
  birthday?: string;
  country_id?: [number, string];
  place_of_birth?: string;
  country_of_birth?: [number, string];
  marital?: string;
  identification_id?: string;
  passport_id?: string;
  joined_date?: string;
  lang?: string;
  bank_account_id?: [number, string];
  certificate?: string;
  study_field?: string;
  study_school?: string;
}

export default function ProfileInfo() {
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const rawUid = localStorage.getItem('uid');
    if (!rawUid) {
      setError('Not logged in');
      setLoading(false);
      return;
    }
    const uid = Number(rawUid);

    const fetchData = async () => {
      try {
        const res = await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid }),
        });
        const data = await res.json();
        console.log("✅ API response:", data);
    
        if (data.error) {
          setError(data.error);
        } else {
          const user = data.user;
          const mappedUser: UserProfile = {
            name: user.name || "-",
            department_id: user.department_id ? [user.department_id[0], user.department_id[1]] : ["", ""],
            job_id: user.job_id ? [user.job_id[0], user.job_id[1]] : ["", ""],
            job_title: user.job_title || "-",
            work_email: user.work_email || "-",
            work_phone: typeof user.work_phone === "string" ? user.work_phone : "-",
            mobile_phone: user.mobile_phone || "-",
            gender: user.gender || "-",
            birthday: user.birthday || "-",
            country_id: user.country_id ? [user.country_id[0], user.country_id[1]] : ["", ""],
            place_of_birth: user.place_of_birth || "-",
            country_of_birth: user.country_of_birth ? [user.country_of_birth[0], user.country_of_birth[1]] : ["", ""],
            marital: user.marital || "-",
            identification_id: user.identification_id || "-",
            passport_id: user.passport_id || "-",
            joined_date: user.joined_date || "-",
            lang: user.lang || "-",
            bank_account_id: user.bank_account_id ? [user.bank_account_id[0], user.bank_account_id[1]] : ["", ""],
            certificate: user.certificate || "-",
            study_field: user.study_field || "-",
            study_school: user.study_school || "-",
          };
          
          setUserData(mappedUser);
        }
      } catch (err) {
        console.error('❌ ProfileInfo fetch error:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };    

    fetchData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center w-full py-8 text-center">Loading profile...</div>;
  }
  if (error) {
    return <Card><CardContent className="text-red-600">{error}</CardContent></Card>;
  }
  if (!userData) {
    return <Card><CardContent>No profile data.</CardContent></Card>;
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="grid gap-6 p-6">
        <h2 className="text-xl font-semibold">Employee Profile</h2>
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ProfileField label="Full Name" value={userData.name} />
          <ProfileField label="Department" value={userData.department_id?.[1]} />
          <ProfileField label="Job Position" value={userData.job_id?.[1]} />
          <ProfileField label="Job Title" value={userData.job_title} />
          <ProfileField label="Work Email" value={userData.work_email} />
          <ProfileField label="Work Phone" value={userData.work_phone} />
          <ProfileField label="Mobile Phone" value={userData.mobile_phone} />
          <ProfileField label="Gender" value={userData.gender} />
          <ProfileField label="Date of Birth" value={userData.birthday} />
          <ProfileField label="Nationality" value={userData.country_id?.[1]} />
          <ProfileField label="Place of Birth" value={userData.place_of_birth} />
          <ProfileField label="Country of Birth" value={userData.country_of_birth?.[1]} />
          <ProfileField label="Marital Status" value={userData.marital} />
          <ProfileField label="IC Number" value={userData.identification_id} />
          <ProfileField label="Passport No" value={userData.passport_id} />
          <ProfileField label="Date Joined" value={userData.joined_date} />
          <ProfileField label="Preferred Language" value={userData.lang} />
          <ProfileField label="Bank Account" value={userData.bank_account_id?.[1]} />
          <ProfileField label="Certificate" value={userData.certificate} />
          <ProfileField label="Field of Study" value={userData.study_field} />
          <ProfileField label="School" value={userData.study_school} />
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileField({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <Label className="text-sm text-muted-foreground">{label}</Label>
      <Input value={value || "-"} readOnly className="mt-1" />
    </div>
  );
}
