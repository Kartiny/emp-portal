'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

interface Profile {
  name: string;
  login: string;
}

export default function ProfileCard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const rawUid = localStorage.getItem('uid');
    if (!rawUid) {
      setError('Not logged in');
      setLoading(false);
      return;
    }
    const uid = Number(rawUid);

    console.log('🐞 ProfileCard fetching for UID:', uid);  // DEBUG LOG

    fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log('✅ /api/profile returned:', data);     // DEBUG LOG
        if (data.error) {
          setError(data.error);
        } else {
          setProfile(data.user);
        }
      })
      .catch((err) => {
        console.error('❌ ProfileCard fetch error:', err); // DEBUG LOG
        setError('Failed to load profile');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent>Loading profile…</CardContent>
      </Card>
    );
  }
  if (error || !profile) {
    return (
      <Card>
        <CardContent className="text-red-600">{error || 'No profile'}</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>👤 Profile</CardTitle>
        <CardDescription>Your account details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        <p><strong>Name:</strong> {profile.name}</p>
        <p><strong>Email:</strong> {profile.login}</p>
      </CardContent>
    </Card>
  );
}
