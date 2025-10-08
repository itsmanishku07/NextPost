"use client";

import { type Comment } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { useAuth } from '@/lib/firebase/auth';
import { startTransition } from 'react';
import { deleteComment } from '@/lib/actions';
import { formatDistanceToNow } from 'date-fns';

export default function CommentList({ comments, postId }: { comments: Comment[]; postId: string }) {
  const { user } = useAuth();
  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No comments yet. Be the first to share your thoughts!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <Card key={comment.id}>
          <CardHeader className="p-4">
            <CardDescription>
              Posted {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="whitespace-pre-wrap">{comment.text}</p>
            {user?.uid === comment.authorId && (
              <div className="mt-3">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (!confirm('Delete this comment?')) return;
                    startTransition(() => deleteComment(postId, comment.id));
                  }}
                >
                  Delete
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
