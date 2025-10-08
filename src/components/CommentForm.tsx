'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { addComment } from '@/lib/actions';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/firebase/auth';
import Link from 'next/link';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Posting...' : 'Post Comment'}
    </Button>
  );
}

type ActionErrors = { _form?: string[] } & Record<string, string[] | undefined>;
type ActionState = { errors: ActionErrors };

export default function CommentForm({ postId }: { postId: string }) {
  const { user } = useAuth();
  const initialState: ActionState = { errors: {} };
  const [state, dispatch] = useActionState<ActionState, FormData>(addComment, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (state.errors?._form) {
      toast({
        title: 'Error',
        description: state.errors._form.join(', '),
        variant: 'destructive',
      });
    } else if (Object.keys(state.errors).length === 0 && formRef.current) {
      // successful submission
      formRef.current.reset();
    }
  }, [state, toast]);

  if (!user) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">Please <Link href="/login" className="underline">log in</Link> to comment.</p>
      </div>
    );
  }

  return (
    <form action={dispatch} ref={formRef} className="space-y-4">
      <input type="hidden" name="postId" value={postId} />
      <Textarea
        name="text"
        placeholder="Add your comment..."
        className="min-h-[100px]"
        required
      />
      {state.errors?.text && (
        <p className="text-sm text-destructive">{state.errors.text.join(', ')}</p>
      )}
      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
