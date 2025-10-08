import { getPosts } from '@/lib/firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';

export default async function Home() {
  const posts = await getPosts();

  return (
    <div className="space-y-8">
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-headline font-bold">No posts yet.</h2>
          <p className="text-muted-foreground mt-2">Why not be the first to create one?</p>
          <Button asChild className="mt-4">
            <Link href="/posts/new">Create Post</Link>
          </Button>
        </div>
      ) : (
        posts.map((post) => (
          <Card key={post.id} className="transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle className="font-headline text-3xl">
                <Link href={`/posts/${post.id}`} className="hover:text-primary transition-colors">
                  {post.title}
                </Link>
              </CardTitle>
              <CardDescription>
                Posted on {format(post.createdAt, 'MMMM d, yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="line-clamp-3">{post.content}</p>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <span>{post.likes}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{post.commentCount || 0}</span>
                </div>
              </div>
              <Button asChild variant="link">
                <Link href={`/posts/${post.id}`}>Read more &rarr;</Link>
              </Button>
            </CardFooter>
          </Card>
        ))
      )}
    </div>
  );
}
