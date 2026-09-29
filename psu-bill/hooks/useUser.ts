'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  email?: string;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user data
    const fetchUser = async () => {
      try {
        // Add API call to fetch user
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch user', error);
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading };
}
