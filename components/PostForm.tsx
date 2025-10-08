'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { createPost } from '@/lib/actions';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Publishing...' : 'Publish Post'}
    </Button>
  );
}

type ActionErrors = { _form?: string[] } & Record<string, string[] | undefined>;
type ActionState = { errors: ActionErrors };

export default function PostForm() {
  const initialState: ActionState = { errors: {} };
  const [state, dispatch] = useActionState<ActionState, FormData>(createPost, initialState);
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);


  useEffect(() => {
    if (state.errors?._form) {
      toast({
        title: 'Error',
        description: state.errors._form.join(', '),
        variant: 'destructive',
      });
    }
  }, [state, toast]);
  
  if (loading || !user) {
    return null;
  }

  return (
    <form action={dispatch}>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">New Post Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" placeholder="Your post title" required />
            {state.errors?.title && (
              <p className="text-sm text-destructive">{state.errors.title.join(', ')}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              name="content"
              placeholder="Write your thoughts..."
              className="min-h-[250px]"
              required
            />
            {state.errors?.content && (
              <p className="text-sm text-destructive">{state.errors.content.join(', ')}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <SubmitButton />
        </CardFooter>
      </Card>
    </form>
  );
}
