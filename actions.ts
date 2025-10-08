'use server';

import { z } from 'zod';
import { db } from './firebase/config';
import { collection, addDoc, serverTimestamp, doc, runTransaction, updateDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { moderateTextPostContent } from '@/ai/flows/moderate-text-post-content';
import { moderateCommentContent } from '@/ai/flows/moderate-comment-content';
import { cookies } from 'next/headers';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getAdminApp } from './firebase/admin';


async function getAuthenticatedUser(): Promise<{ uid: string; displayName: string; } | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    if (!sessionCookie) {
      return null;
    }
    const adminApp = getAdminApp();
    const decodedIdToken = await getAdminAuth(adminApp).verifySessionCookie(sessionCookie, true);
    return {
        uid: decodedIdToken.uid,
        displayName: decodedIdToken.name || 'Anonymous'
    };
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
}

const postSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  content: z.string().min(1, 'Content is required'),
});

export async function createPost(prevState: any, formData: FormData) {
  const validatedFields = postSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const user = await getAuthenticatedUser();
  
  if (!user) {
     return {
      errors: { _form: ['You must be logged in to create a post.'] },
    };
  }


  const { title, content } = validatedFields.data;

  try {
    const moderationResult = await moderateTextPostContent({ text: `${title}\n${content}` });

    const newPost = {
      title,
      content,
      likes: 0,
      createdAt: serverTimestamp(),
      isFlagged: moderationResult.isFlagged,
      moderationReason: moderationResult.reason,
      authorId: user.uid,
      authorName: user.displayName,
    };

    const docRef = await addDoc(collection(db, 'posts'), newPost);

    revalidatePath('/');
    revalidatePath(`/posts/${docRef.id}`);
    redirect(`/posts/${docRef.id}`);

  } catch (error) {
    console.error('Error creating post:', error);
    return {
      errors: { _form: ['An unexpected error occurred. Please try again.'] },
    };
  }
}

export async function likePost(postId: string) {
  const postRef = doc(db, 'posts', postId);

  try {
    await runTransaction(db, async (transaction) => {
      const postDoc = await transaction.get(postRef);
      if (!postDoc.exists()) {
        throw 'Document does not exist!';
      }
      const newLikes = (postDoc.data().likes || 0) + 1;
      transaction.update(postRef, { likes: newLikes });
    });
    revalidatePath('/');
    revalidatePath(`/posts/${postId}`);
  } catch (error) {
    console.error('Error liking post:', error);
    // Handle error appropriately
  }
}

const commentSchema = z.object({
    text: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment is too long'),
    postId: z.string().min(1),
});


export async function addComment(prevState: any, formData: FormData) {
    const validatedFields = commentSchema.safeParse({
        text: formData.get('text'),
        postId: formData.get('postId'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }
    
    const user = await getAuthenticatedUser();

    if (!user) {
        return {
            errors: { _form: ['You must be logged in to comment.'] },
        };
    }

    const { text, postId } = validatedFields.data;

    try {
        const moderationResult = await moderateCommentContent({ text });

        const newComment = {
            text,
            createdAt: serverTimestamp(),
            isFlagged: moderationResult.flagged,
            moderationReason: moderationResult.reason,
            authorId: user.uid,
            authorName: user.displayName,
        };

        const commentRef = await addDoc(collection(db, 'posts', postId, 'comments'), newComment);

        // Update comment count on the post
        const postRef = doc(db, 'posts', postId);
        await runTransaction(db, async (transaction) => {
            const postDoc = await transaction.get(postRef);
            if (!postDoc.exists()) {
                throw "Post does not exist!";
            }
            const currentCommentCount = postDoc.data().commentCount || 0;
            transaction.update(postRef, { commentCount: currentCommentCount + 1 });
        });


        revalidatePath(`/posts/${postId}`);
        return { errors: {} };
    } catch (error) {
        console.error('Error adding comment:', error);
        return {
            errors: { _form: ['An unexpected error occurred. Please try again.'] },
        };
    }
}