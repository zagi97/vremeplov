// src/components/PhotoComments.tsx
import React, { useState } from 'react';
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { User, MessageSquare, Send, LogIn } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { CharacterCounter } from "./ui/character-counter";
import { useLanguage, translateWithParams } from "../contexts/LanguageContext";

interface Comment {
  id: number;
  author: string;
  text: string;
  date: string;
}

// U PhotoComments.tsx, dodaj photo prop i označi autora:

interface PhotoCommentsProps {
  comments: Comment[];
  onAddComment: (text: string) => void;
  photoAuthor?: string; // Dodaj ovo
}

const PhotoComments = ({ comments, onAddComment, photoAuthor }: PhotoCommentsProps) => {
  const [newComment, setNewComment] = useState("");
  const { user, signInWithGoogle } = useAuth();
  const { t } = useLanguage();

  const handleSignInToComment = async () => {
    try {
      await signInWithGoogle();
      toast.success(t('comments.signInSuccess'));
    } catch (error) {
      toast.error(t('comments.signInError'));
    }
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    onAddComment(newComment);
    setNewComment("");
    toast.success(t('comments.commentAdded'));
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">
        <MessageSquare className="h-5 w-5 inline mr-2" />
        {translateWithParams(t, 'comments.title', { count: comments.length })}
      </h2>
      
      {user ? (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <Textarea 
            placeholder={t('comments.placeholder')}
            className="min-h-[80px] mb-2"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            maxLength={250}
          />
          <CharacterCounter currentLength={newComment.length} maxLength={250} />
          <Button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700"
            disabled={!newComment.trim()}
          >
            <Send className="h-4 w-4 mr-2" />
            {t('comments.postComment')}
          </Button>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
          <LogIn className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-600 mb-3">{t('comments.signInMessage')}</p>
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
        {comments.map((comment) => {
          const isAuthor = photoAuthor && comment.author === photoAuthor;
          
          return (
            <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-600" />
                  <span className="font-medium">
                    {comment.author}
                    {isAuthor && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {t('comments.author')}
                      </span>
                    )}
                  </span>
                </div>
                <span className="text-gray-500 text-sm">{comment.date}</span>
              </div>
              <p className="text-gray-700">{comment.text}</p>
            </div>
          );
        })}
        
        {comments.length === 0 && (
          <p className="text-gray-500 text-center py-4">
            {t('comments.noComments')}
          </p>
        )}
      </div>
    </div>
  );
};
export default PhotoComments;