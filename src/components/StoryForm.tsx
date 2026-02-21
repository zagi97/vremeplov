// src/components/StoryForm.tsx
import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { storyService } from '../services/firebaseService';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import { Send, X } from 'lucide-react';

interface StoryFormProps {
  locationName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const StoryForm = ({ locationName, onSuccess, onCancel }: StoryFormProps) => {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const MAX_TITLE_LENGTH = 100;
  const MAX_CONTENT_LENGTH = 5000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error(t('stories.fillRequired'));
      return;
    }

    try {
      setSubmitting(true);

      await storyService.addStory({
        title: title.trim(),
        content: content.trim(),
        location: locationName,
      });

      toast.success(t('stories.uploadSuccess'));
      onSuccess();
    } catch (error) {
      console.error('Error submitting story:', error);
      toast.error(t('stories.uploadError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {t('stories.shareStory')}
        </h2>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('stories.title')} <span className="text-red-500">*</span>
        </label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE_LENGTH))}
          placeholder={t('stories.titlePlaceholder')}
          className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          disabled={submitting}
        />
        <p className="text-xs text-gray-400 mt-1 text-right">
          {title.length}/{MAX_TITLE_LENGTH} {t('text.characterCounter')}
        </p>
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('stories.content')} <span className="text-red-500">*</span>
        </label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, MAX_CONTENT_LENGTH))}
          placeholder={t('stories.contentPlaceholder')}
          className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 min-h-[200px]"
          rows={8}
          disabled={submitting}
        />
        <p className="text-xs text-gray-400 mt-1 text-right">
          {content.length}/{MAX_CONTENT_LENGTH} {t('text.characterCounter')}
        </p>
      </div>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          {t('stories.approvalNote')}
        </p>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
          className="flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          {t('common.cancel')}
        </Button>
        <Button
          type="submit"
          disabled={submitting || !title.trim() || !content.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          {submitting ? t('stories.submitting') : t('stories.submit')}
        </Button>
      </div>
    </form>
  );
};

export default StoryForm;
