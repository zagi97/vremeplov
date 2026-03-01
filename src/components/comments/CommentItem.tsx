import { Link } from 'react-router-dom';
import { User } from 'lucide-react';
import type { Comment } from '@/hooks/usePhotoComments';

interface CommentItemProps {
  comment: Comment;
  photoAuthorId?: string;
  t: (key: string) => string;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, photoAuthorId, t }) => {
  const isPhotoAuthor = photoAuthorId && comment.userId === photoAuthorId;

  return (
    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors">
      <div className="flex items-start justify-between mb-2 gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
            {comment.userId ? (
              <Link
                to={`/user/${comment.userId}`}
                className="font-medium break-words text-blue-600 dark:text-blue-400 underline"
              >
                {comment.userName || 'Nepoznato'}
              </Link>
            ) : (
              <span className="font-medium break-words text-gray-900 dark:text-gray-100">
                {comment.userName || 'Nepoznato'}
              </span>
            )}
          </div>
          {isPhotoAuthor && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full whitespace-nowrap">
              {t('comments.author')}
            </span>
          )}
        </div>
        <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm whitespace-nowrap">
          {comment.date}
        </span>
      </div>
      <p className="text-gray-700 dark:text-gray-300 break-words leading-relaxed">
        {comment.text}
      </p>
    </div>
  );
};

export default CommentItem;
