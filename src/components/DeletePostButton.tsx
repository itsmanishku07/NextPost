'use client';

import { useState, startTransition } from 'react';
import { Button } from './ui/button';
import { Trash2 } from 'lucide-react';
import { deletePost } from '@/lib/actions';
import { useRouter } from 'next/navigation';

export default function DeletePostButton({ postId }: { postId: string }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm('Delete this post? This cannot be undone.')) return;
        setPending(true);
        startTransition(async () => {
          try {
            await deletePost(postId);
            router.push('/');
          } catch (e) {
            // swallow; server action throws for non-author
          } finally {
            setPending(false);
          }
        });
      }}
      className="flex items-center gap-2"
    >
      <Trash2 className="w-4 h-4" />
      {pending ? 'Deleting...' : 'Delete'}
    </Button>
  );
}


