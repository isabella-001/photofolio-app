'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ImageIcon } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    try {
      const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
      if (isAuthenticated) {
        router.replace('/folio');
      } else {
        router.replace('/login');
      }
    } catch (e) {
      console.error("Couldn't use localStorage", e);
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <ImageIcon className="h-16 w-16 text-primary animate-pulse mb-4" />
      <h1 className="text-2xl font-bold">Loading PhotoFolio...</h1>
    </div>
  );
}
