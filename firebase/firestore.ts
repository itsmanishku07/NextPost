import { db } from './config';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  getDoc,
  getCountFromServer,
} from 'firebase/firestore';
import type { Post, Comment, PostDocument, CommentDocument } from '../types';

export async function getPosts(): Promise<Post[]> {
  const postsQuery = query(
    collection(db, 'posts'),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(postsQuery);
  const posts: Post[] = [];

  for (const doc of querySnapshot.docs) {
    const postData = doc.data() as PostDocument;
    
    if (postData.isFlagged) {
      continue;
    }

    // Get comment count
    const commentsCol = collection(db, 'posts', doc.id, 'comments');
    const commentsQuery = query(commentsCol, where('isFlagged', '==', false));
    const commentCountSnapshot = await getCountFromServer(commentsQuery);
    const commentCount = commentCountSnapshot.data().count;

    posts.push({
      id: doc.id,
      ...postData,
      createdAt: postData.createdAt.toDate(),
      commentCount,
    });
  }
  return posts;
}

export async function getPost(id: string): Promise<Post | null> {
  const docRef = doc(db, 'posts', id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }
  
  const postData = docSnap.data() as PostDocument;

  if (postData.isFlagged) {
    return null;
  }
  
  // Get comment count
  const commentsCol = collection(db, 'posts', id, 'comments');
  const commentsQuery = query(commentsCol, where('isFlagged', '==', false));
  const commentCountSnapshot = await getCountFromServer(commentsQuery);
  const commentCount = commentCountSnapshot.data().count;

  return {
    id: docSnap.id,
    ...postData,
    createdAt: postData.createdAt.toDate(),
    commentCount,
  };
}

export async function getComments(postId: string): Promise<Comment[]> {
  const commentsQuery = query(
    collection(db, 'posts', postId, 'comments'),
    orderBy('createdAt', 'asc')
  );

  const querySnapshot = await getDocs(commentsQuery);
  const comments: Comment[] = [];
  querySnapshot.forEach((doc) => {
    const commentData = doc.data() as CommentDocument;
    if (!commentData.isFlagged) {
        comments.push({
            id: doc.id,
            ...commentData,
            createdAt: commentData.createdAt.toDate(),
        });
    }
  });
  return comments;
}
