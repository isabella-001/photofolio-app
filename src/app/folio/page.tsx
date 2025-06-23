'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PhotoFolioApp } from '@/components/photo-folio-app';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageIcon } from 'lucide-react';

export default function FolioPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const authStatus = localStorage.getItem('isAuthenticated') === 'true';
      setIsAuthenticated(authStatus);
      if (!authStatus) {
        router.push('/login');
      }
    } catch (e) {
      console.error("Couldn't use localStorage", e);
      setIsAuthenticated(false);
      router.push('/login');
    }
  }, [router]);

  if (isAuthenticated === null) {
    return (
       <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <ImageIcon className="h-16 w-16 text-primary animate-pulse mb-4" />
        <h1 className="text-2xl font-bold">Loading PhotoFolio...</h1>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Or a message saying "Redirecting to login..."
  }

  return <PhotoFolioApp />;
}
