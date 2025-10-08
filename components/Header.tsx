'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { PlusCircle } from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth';
import UserNav from './UserNav';

export default function Header() {
  const { user, loading } = useAuth();

  return (
    <header className="bg-card border-b sticky top-0 z-10">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold font-headline text-primary">
            TextHub
          </Link>
          <div className="flex items-center gap-4">
            {loading ? null : user ? (
              <>
                <Button asChild>
                  <Link href="/posts/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Post
                  </Link>
                </Button>
                <UserNav />
              </>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link href="/login">Log In</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
