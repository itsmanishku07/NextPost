'use client';

import { useEffect, useOptimistic, startTransition, useState } from 'react';
import { Button } from './ui/button';
import { Heart } from 'lucide-react';
import { likePost, unlikePost } from '@/lib/actions';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export default function LikeButton({ postId, likes }: { postId: string; likes: number }) {
  const { user } = useAuth();
  const [optimisticLikes, addOptimisticLike] = useOptimistic(
    likes,
    (state) => state + 1
  );
  const [alreadyLiked, setAlreadyLiked] = useState(false);
  const isDisabled = !user;

  useEffect(() => {
    let cancelled = false;
    async function checkLike() {
      try {
        if (!user) {
          setAlreadyLiked(false);
          return;
        }
        const likeRef = doc(db, 'posts', postId, 'likes', user.uid);
        const likeSnap = await getDoc(likeRef);
        if (!cancelled) setAlreadyLiked(likeSnap.exists());
      } catch {
        if (!cancelled) setAlreadyLiked(false);
      }
    }
    checkLike();
    return () => { cancelled = true; };
  }, [user, postId]);

  return (
    <Button
      variant="outline"
      size="lg"
      disabled={isDisabled}
      onClick={() => {
        startTransition(() => {
          if (alreadyLiked) {
            addOptimisticLike(Math.max(optimisticLikes - 1, 0));
            unlikePost(postId);
            setAlreadyLiked(false);
          } else {
            addOptimisticLike(optimisticLikes + 1);
            likePost(postId);
            setAlreadyLiked(true);
          }
        });
      }}
      className="flex items-center gap-2 group transition-all"
    >
      <Heart className={cn(
        "w-5 h-5",
        (alreadyLiked || optimisticLikes > likes) ? 'fill-destructive text-destructive' : undefined
      )} />
      <span className="font-semibold text-lg">{optimisticLikes}</span>
    </Button>
  );
}
