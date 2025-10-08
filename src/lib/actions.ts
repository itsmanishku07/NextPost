'use server';

import { z } from 'zod';
import { db } from './firebase/config';
import { collection, addDoc, serverTimestamp, doc, runTransaction, updateDoc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { moderateTextPostContent } from '@/ai/flows/moderate-text-post-content';
import { moderateCommentContent } from '@/ai/flows/moderate-comment-content';
import { cookies } from 'next/headers';

function decodeJwtPayload(token: string): any {
  const parts = token.split('.');
  if (parts.length < 2) throw new Error('Invalid JWT');
  const base64Url = parts[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(base64Url.length / 4) * 4, '=');
  const json = Buffer.from(base64, 'base64').toString('utf8');
  return JSON.parse(json);
}


async function getAuthenticatedUser(): Promise<{ uid: string; displayName: string; } | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    if (!sessionCookie) {
      return null;
    }
    // Decode JWT payload without verification. In production, use Admin SDK verifyIdToken.
    const payload = decodeJwtPayload(sessionCookie);
    return {
      uid: payload.user_id || payload.uid,
      displayName: payload.name || 'Anonymous',
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

  let user = await getAuthenticatedUser();
  if (!user) {
    const idToken = (formData.get('idToken') || '').toString();
    if (idToken) {
      try {
        const payload = decodeJwtPayload(idToken);
        user = {
          uid: payload.user_id || payload.uid,
          displayName: payload.name || 'Anonymous',
        };
      } catch (e) {
        // ignore
      }
    }
  }
  
  if (!user) {
     return {
      errors: { _form: ['You must be logged in to create a post.'] },
    };
  }


  const { title, content } = validatedFields.data;

  try {
    let moderationResult: { isFlagged: boolean; reason: string } = { isFlagged: false, reason: '' };
    try {
      moderationResult = await moderateTextPostContent({ text: `${title}\n${content}` });
    } catch (e) {
      // If moderation fails, continue without blocking post creation.
      moderationResult = { isFlagged: false, reason: 'moderation_unavailable' };
    }

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
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error('You must be logged in to like a post.');
  }

  const postRef = doc(db, 'posts', postId);
  const userLikeRef = doc(db, 'posts', postId, 'likes', user.uid);

  try {
    await runTransaction(db, async (transaction) => {
      const [postSnap, likeSnap] = await Promise.all([
        transaction.get(postRef),
        transaction.get(userLikeRef),
      ]);

      if (!postSnap.exists()) {
        throw 'Post does not exist!';
      }

      if (likeSnap.exists()) {
        // User already liked; no-op
        return;
      }

      const currentLikes = postSnap.data().likes || 0;
      transaction.update(postRef, { likes: currentLikes + 1 });
      transaction.set(userLikeRef, { userId: user.uid, createdAt: serverTimestamp() });
    });
    revalidatePath('/');
    revalidatePath(`/posts/${postId}`);
  } catch (error) {
    console.error('Error liking post:', error);
  }
}

export async function unlikePost(postId: string) {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error('You must be logged in to unlike a post.');
  }

  const postRef = doc(db, 'posts', postId);
  const userLikeRef = doc(db, 'posts', postId, 'likes', user.uid);

  try {
    await runTransaction(db, async (transaction) => {
      const [postSnap, likeSnap] = await Promise.all([
        transaction.get(postRef),
        transaction.get(userLikeRef),
      ]);

      if (!postSnap.exists()) {
        throw 'Post does not exist!';
      }

      if (!likeSnap.exists()) {
        // No like to remove; no-op
        return;
      }

      const currentLikes = postSnap.data().likes || 0;
      const nextLikes = currentLikes > 0 ? currentLikes - 1 : 0;
      transaction.update(postRef, { likes: nextLikes });
      transaction.delete(userLikeRef);
    });
    revalidatePath('/');
    revalidatePath(`/posts/${postId}`);
  } catch (error) {
    console.error('Error unliking post:', error);
  }
}

export async function deletePost(postId: string) {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error('You must be logged in to delete a post.');
  }

  const postRef = doc(db, 'posts', postId);
  const postSnap = await getDoc(postRef);
  if (!postSnap.exists()) {
    throw new Error('Post not found.');
  }

  const postData = postSnap.data() as any;
  if (postData.authorId !== user.uid) {
    throw new Error('Only the author can delete this post.');
  }

  await deleteDoc(postRef);
  revalidatePath('/');
  revalidatePath(`/posts/${postId}`);
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
        // reason is optional from the flow; normalize to string
        let moderationResult: { flagged: boolean; reason: string } = { flagged: false, reason: '' };
        try {
          const raw = await moderateCommentContent({ text });
          moderationResult = { flagged: raw.flagged, reason: raw.reason ?? '' };
        } catch (e) {
          // If moderation fails, continue without blocking comment creation.
          moderationResult = { flagged: false, reason: 'moderation_unavailable' };
        }

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

export async function deleteComment(postId: string, commentId: string) {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error('You must be logged in to delete a comment.');
  }

  const postRef = doc(db, 'posts', postId);
  const commentRef = doc(db, 'posts', postId, 'comments', commentId);

  try {
    await runTransaction(db, async (transaction) => {
      const [postSnap, commentSnap] = await Promise.all([
        transaction.get(postRef),
        transaction.get(commentRef),
      ]);

      if (!postSnap.exists()) {
        throw 'Post does not exist!';
      }
      if (!commentSnap.exists()) {
        return; // already deleted
      }
      const data = commentSnap.data() as any;
      if (data.authorId !== user.uid) {
        throw new Error('Only the comment author can delete this comment.');
      }

      transaction.delete(commentRef);
      const currentCommentCount = postSnap.data().commentCount || 0;
      transaction.update(postRef, { commentCount: currentCommentCount > 0 ? currentCommentCount - 1 : 0 });
    });
    revalidatePath(`/posts/${postId}`);
  } catch (error) {
    console.error('Error deleting comment:', error);
  }
}

const editPostSchema = z.object({
  postId: z.string().min(1),
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  content: z.string().min(1, 'Content is required'),
});

export async function updatePost(prevState: any, formData: FormData) {
  const validated = editPostSchema.safeParse({
    postId: formData.get('postId'),
    title: formData.get('title'),
    content: formData.get('content'),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return { errors: { _form: ['You must be logged in to edit a post.'] } };
  }

  const { postId, title, content } = validated.data;
  const postRef = doc(db, 'posts', postId);
  try {
    await runTransaction(db, async (transaction) => {
      const postSnap = await transaction.get(postRef);
      if (!postSnap.exists()) throw new Error('Post not found');
      const data = postSnap.data() as any;
      if (data.authorId !== user.uid) throw new Error('Only the author can edit this post.');
      transaction.update(postRef, { title, content });
    });
    revalidatePath('/');
    revalidatePath(`/posts/${postId}`);
    redirect(`/posts/${postId}`);
  } catch (error) {
    console.error('Error updating post:', error);
    return { errors: { _form: ['Failed to update post'] } };
  }
}