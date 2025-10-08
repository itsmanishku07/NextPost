'use client';

import { useOptimistic, startTransition } from 'react';
import { Button } from './ui/button';
import { Heart } from 'lucide-react';
import { likePost } from '@/lib/actions';
import { cn } from '@/lib/utils';

export default function LikeButton({ postId, likes }: { postId: string; likes: number }) {
  const [optimisticLikes, addOptimisticLike] = useOptimistic(
    likes,
    (state) => state + 1
  );

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={() => {
        startTransition(() => {
          addOptimisticLike(optimisticLikes + 1);
          likePost(postId);
        });
      }}
      className="flex items-center gap-2 group transition-all"
    >
      <Heart className={cn("w-5 h-5 group-hover:fill-destructive group-hover:text-destructive transition-colors", optimisticLikes > likes && 'fill-destructive text-destructive')} />
      <span className="font-semibold text-lg">{optimisticLikes}</span>
    </Button>
  );
}
