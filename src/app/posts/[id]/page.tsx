import { getPost, getComments } from '@/lib/firebase/firestore';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import LikeButton from '@/components/LikeButton';
import CommentList from '@/components/CommentList';
import CommentForm from '@/components/CommentForm';
import DeletePostButton from '@/components/DeletePostButton';
import { format } from 'date-fns';
import { cookies } from 'next/headers';

export default async function PostPage({ params }: { params: { id: string } }) {
  const post = await getPost(params.id);

  if (!post) {
    notFound();
  }

  const comments = await getComments(params.id);

  // Determine if current user is the author (best-effort using client session cookie payload)
  let isAuthor = false;
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    if (session) {
      const payload = JSON.parse(Buffer.from(session.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
      const uid = payload.user_id || payload.uid;
      if (uid && post.authorId && uid === post.authorId) {
        isAuthor = true;
      }
    }
  } catch {
    isAuthor = false;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-4xl md:text-5xl font-headline !leading-tight">{post.title}</CardTitle>
          <CardDescription className="pt-2">
            Posted on {format(post.createdAt, 'MMMM d, yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-lg max-w-none text-lg leading-relaxed whitespace-pre-wrap">
          {post.content}
        </CardContent>
        <CardFooter className="flex flex-col gap-6 items-center pt-8">
            <LikeButton postId={post.id} likes={post.likes} />
            {isAuthor && <DeletePostButton postId={post.id} />}
        </CardFooter>
      </Card>

      <Separator className="my-12" />

      <div className="space-y-8">
        <h2 className="text-3xl font-bold font-headline">Comments ({comments.length})</h2>
        <CommentForm postId={post.id} />
        <CommentList comments={comments} postId={post.id} />
      </div>
    </div>
  );
}
