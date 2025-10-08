import { getPost, getComments } from '@/lib/firebase/firestore';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import LikeButton from '@/components/LikeButton';
import CommentList from '@/components/CommentList';
import CommentForm from '@/components/CommentForm';
import { format } from 'date-fns';

export default async function PostPage({ params }: { params: { id: string } }) {
  const post = await getPost(params.id);

  if (!post) {
    notFound();
  }

  const comments = await getComments(params.id);

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
        </CardFooter>
      </Card>

      <Separator className="my-12" />

      <div className="space-y-8">
        <h2 className="text-3xl font-bold font-headline">Comments ({comments.length})</h2>
        <CommentForm postId={post.id} />
        <CommentList comments={comments} />
      </div>
    </div>
  );
}
