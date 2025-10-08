import { type Timestamp } from 'firebase/firestore';

export type Post = {
  id: string;
  title: string;
  content: string;
  likes: number;
  createdAt: Date;
  isFlagged: boolean;
  moderationReason?: string;
  commentCount?: number;
  authorId?: string;
  authorName?: string;
};

export type PostDocument = Omit<Post, 'id' | 'createdAt' | 'commentCount'> & {
  createdAt: Timestamp;
};


export type Comment = {
  id: string;
  text: string;
  createdAt: Date;
  isFlagged: boolean;
  moderationReason?: string;
  authorId: string;
  authorName: string;
};

export type CommentDocument = Omit<Comment, 'id' | 'createdAt'> & {
    createdAt: Timestamp;
};
