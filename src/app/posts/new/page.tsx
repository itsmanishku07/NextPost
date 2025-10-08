import PostForm from '@/components/PostForm';

export default function NewPostPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold font-headline mb-8">Create a New Post</h1>
      <PostForm />
    </div>
  );
}
