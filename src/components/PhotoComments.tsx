// src/components/PhotoComments.tsx
import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { User, MessageSquare, Send, LogIn } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { CharacterCounter } from "./ui/character-counter";
import { useLanguage, translateWithParams } from "../contexts/LanguageContext";
import { 
  collection, 
  query, 
  where,
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Comment {
  id: string;
  author: string;
  authorId?: string;
  text: string;
  date: string;
  timestamp: Timestamp | null;
  photoId: string;
}

interface PhotoCommentsProps {
  photoId: string;
  photoAuthor?: string;
  photoAuthorId?: string;
}

const PhotoComments = ({ photoId, photoAuthor, photoAuthorId }: PhotoCommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const { user, signInWithGoogle } = useAuth();
  const { t } = useLanguage();

  // LIVE LISTENER za komentare - glavna kolekcija
  useEffect(() => {
    if (!photoId) {
      setLoading(false);
      return;
    }

    const commentsRef = collection(db, 'comments');
    const q = query(
      commentsRef,
      where('photoId', '==', photoId),
      where('isApproved', '==', true),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        const fetchedComments: Comment[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          
          fetchedComments.push({
            id: doc.id,
            author: data.author || 'Nepoznato',
            authorId: data.authorId || '',
            text: data.text || '',
            photoId: data.photoId || '',
            timestamp: data.createdAt || null,
            date: data.createdAt 
              ? new Date(data.createdAt.toMillis()).toLocaleDateString('hr-HR', {
                  day: 'numeric',
                  month: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : 'Upravo sad'
          });
        });
        
        setComments(fetchedComments);
        setLoading(false);
      }, 
      (error) => {
        console.error('Greška pri dohvaćanju komentara:', error);
        toast.error('Greška pri učitavanju komentara');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [photoId]);

  const handleSignInToComment = async () => {
    try {
      await signInWithGoogle();
      toast.success(t('comments.signInSuccess'));
    } catch (error) {
      console.error('Greška pri prijavi:', error);
      toast.error(t('comments.signInError'));
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      toast.error('Komentar ne može biti prazan');
      return;
    }
    
    if (!user) {
      toast.error('Morate biti prijavljeni');
      return;
    }

    try {
      const commentsRef = collection(db, 'comments');
      
      await addDoc(commentsRef, {
        photoId: photoId,
        author: user.displayName || 'Nepoznato',
        authorId: user.uid,
        text: newComment.trim(),
        createdAt: serverTimestamp(),
        isApproved: true
      });
      
      setNewComment("");
      toast.success(t('comments.commentAdded'));
    } catch (error) {
      console.error('Greška pri dodavanju komentara:', error);
      toast.error('Greška pri objavljivanju komentara');
    }
  };

  return (
    <div className="mt-8 px-4 sm:px-0">
      <h2 className="text-2xl font-bold mb-4 flex items-center">
        <MessageSquare className="h-5 w-5 mr-2 flex-shrink-0" />
        <span>
          {translateWithParams(t, 'comments.title', { count: comments.length })}
        </span>
      </h2>
      
      {user ? (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <Textarea 
            placeholder={t('comments.placeholder')}
            className="min-h-[80px] mb-2 w-full"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            maxLength={250}
          />
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CharacterCounter currentLength={newComment.length} maxLength={250} />
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!newComment.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              {t('comments.postComment')}
            </Button>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-6 bg-gray-50 rounded-lg text-center">
          <LogIn className="h-8 w-8 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600 mb-4 px-4">{t('comments.signInMessage')}</p>
          <Button 
            onClick={handleSignInToComment}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <LogIn className="h-4 w-4 mr-2" />
            {t('comments.signInToComment')}
          </Button>
        </div>
      )}
      
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="text-gray-500 mt-2">Učitavanje komentara...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">
              {t('comments.noComments')}
            </p>
          </div>
        ) : (
          comments.map((comment) => {
            const isPhotoAuthor = photoAuthorId && comment.authorId === photoAuthorId;
            
            return (
              <div 
                key={comment.id} 
                className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-600 flex-shrink-0" />
                      <span className="font-medium break-words">
                        {comment.author}
                      </span>
                    </div>
                    {isPhotoAuthor && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full whitespace-nowrap">
                        {t('comments.author')}
                      </span>
                    )}
                  </div>
                  <span className="text-gray-500 text-xs sm:text-sm whitespace-nowrap">
                    {comment.date}
                  </span>
                </div>
                <p className="text-gray-700 break-words leading-relaxed">
                  {comment.text}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PhotoComments;