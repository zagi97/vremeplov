// src/components/admin/tabs/StoryModerationTab.tsx
import { useState } from 'react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';
import { Input } from '../../ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../ui/alert-dialog';
import { Check, X, BookOpen, MapPin, User, Calendar, Edit, Trash2, Save } from 'lucide-react';
import type { Story } from '../../../services/firebaseService';

interface StoryModerationTabProps {
  pendingStories: Story[];
  approvedStories: Story[];
  loading: boolean;
  adminUid: string;
  handleApproveStory: (storyId: string, adminUid: string) => void;
  handleRejectStory: (storyId: string, reason: string) => void;
  handleDeleteStory: (storyId: string, reason: string) => void;
  handleEditStory: (storyId: string, updates: Partial<Story>) => void;
}

const formatDate = (timestamp: any) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('hr-HR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

function RejectReasonDialog({
  trigger,
  title,
  description,
  onConfirm,
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  onConfirm: (reason: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState({
    notRelevant: false,
    inappropriate: false,
    lowQuality: false,
    custom: '',
  });

  const hasReason =
    reason.notRelevant ||
    reason.inappropriate ||
    reason.lowQuality ||
    reason.custom.trim().length > 0;

  const buildReasonText = () => {
    const reasons: string[] = [];
    if (reason.notRelevant) reasons.push('Sadržaj nije relevantan');
    if (reason.inappropriate) reasons.push('Neprimjeren sadržaj');
    if (reason.lowQuality) reasons.push('Nekvalitetan sadržaj');
    if (reason.custom.trim()) reasons.push(reason.custom.trim());
    return reasons.join('; ');
  };

  const handleConfirm = () => {
    onConfirm(buildReasonText());
    setOpen(false);
    setReason({ notRelevant: false, inappropriate: false, lowQuality: false, custom: '' });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
        <AlertDialogHeader>
          <AlertDialogTitle className="dark:text-gray-100">{title}</AlertDialogTitle>
          <AlertDialogDescription className="dark:text-gray-400">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={reason.notRelevant}
                onChange={(e) => setReason((prev) => ({ ...prev, notRelevant: e.target.checked }))}
                className="w-4 h-4 text-red-600 rounded"
              />
              <span className="text-sm dark:text-gray-200">Sadržaj nije relevantan</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={reason.inappropriate}
                onChange={(e) => setReason((prev) => ({ ...prev, inappropriate: e.target.checked }))}
                className="w-4 h-4 text-red-600 rounded"
              />
              <span className="text-sm dark:text-gray-200">Neprimjeren sadržaj</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={reason.lowQuality}
                onChange={(e) => setReason((prev) => ({ ...prev, lowQuality: e.target.checked }))}
                className="w-4 h-4 text-red-600 rounded"
              />
              <span className="text-sm dark:text-gray-200">Nekvalitetan sadržaj</span>
            </label>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2 dark:text-gray-200">
              Ostalo (ručni unos):
            </label>
            <Textarea
              value={reason.custom}
              onChange={(e) => {
                const value = e.target.value.slice(0, 250);
                setReason((prev) => ({ ...prev, custom: value }));
              }}
              placeholder="Dodatni razlog..."
              rows={3}
              maxLength={250}
              className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
            <p className="text-sm mt-1 text-muted-foreground dark:text-gray-400">
              {reason.custom.length}/250 znakova
            </p>
          </div>

          {!hasReason && (
            <p className="text-sm text-orange-600 dark:text-orange-400">
              Odaberite barem jedan razlog.
            </p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600">
            Odustani
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!hasReason}
            className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
          >
            Potvrdi
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function StoryEditForm({
  story,
  onSave,
  onCancel,
}: {
  story: Story;
  onSave: (updates: Partial<Story>) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(story.title);
  const [content, setContent] = useState(story.content);

  const hasChanges = title !== story.title || content !== story.content;
  const isValid = title.trim().length > 0 && content.trim().length > 0;

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium block mb-1 dark:text-gray-200">Naslov</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 100))}
          maxLength={100}
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
        <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
          {title.length}/100
        </p>
      </div>
      <div>
        <label className="text-sm font-medium block mb-1 dark:text-gray-200">Sadržaj</label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, 5000))}
          maxLength={5000}
          rows={6}
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
        <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
          {content.length}/5000
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => onSave({ title: title.trim(), content: content.trim() })}
          disabled={!hasChanges || !isValid}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Save className="h-4 w-4 mr-1" />
          Spremi
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} className="dark:border-gray-600 dark:text-gray-200">
          Odustani
        </Button>
      </div>
    </div>
  );
}

export default function StoryModerationTab({
  pendingStories,
  approvedStories,
  loading,
  adminUid,
  handleApproveStory,
  handleRejectStory,
  handleDeleteStory,
  handleEditStory,
}: StoryModerationTabProps) {
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Učitavanje priča...</p>
      </div>
    );
  }

  const renderStoryCard = (story: Story, isPending: boolean) => {
    const isEditing = editingStoryId === story.id;

    return (
      <Card key={story.id} className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-6">
          {isEditing ? (
            <StoryEditForm
              story={story}
              onSave={(updates) => {
                handleEditStory(story.id!, updates);
                setEditingStoryId(null);
              }}
              onCancel={() => setEditingStoryId(null)}
            />
          ) : (
            <div className="flex flex-col lg:flex-row lg:items-start gap-4">
              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {story.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-4 mb-3 whitespace-pre-wrap">
                  {story.content}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {story.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {story.authorName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(story.createdAt)}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0 flex-wrap">
                {isPending && (
                  <Button
                    size="sm"
                    onClick={() => handleApproveStory(story.id!, adminUid)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Odobri
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingStoryId(story.id!)}
                  className="dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Uredi
                </Button>

                {isPending ? (
                  <RejectReasonDialog
                    trigger={
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 dark:text-red-400 border-red-600 dark:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Odbij
                      </Button>
                    }
                    title="Odbij priču"
                    description={`Odaberite razlog odbijanja priče "${story.title}". Autor će dobiti obavijest.`}
                    onConfirm={(reason) => handleRejectStory(story.id!, reason)}
                  />
                ) : (
                  <RejectReasonDialog
                    trigger={
                      <Button size="sm" variant="destructive">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Obriši
                      </Button>
                    }
                    title="Obriši priču"
                    description={`Odaberite razlog brisanja priče "${story.title}". Autor će dobiti obavijest.`}
                    onConfirm={(reason) => handleDeleteStory(story.id!, reason)}
                  />
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      {/* Pending Stories */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-orange-500" />
          Priče na čekanju ({pendingStories.length})
        </h3>

        {pendingStories.length === 0 ? (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="py-8 text-center text-gray-500 dark:text-gray-400">
              Nema priča za pregled.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingStories.map((story) => renderStoryCard(story, true))}
          </div>
        )}
      </div>

      {/* Approved Stories */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-green-500" />
          Odobrene priče ({approvedStories.length})
        </h3>

        {approvedStories.length === 0 ? (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="py-8 text-center text-gray-500 dark:text-gray-400">
              Još nema odobrenih priča.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {approvedStories.map((story) => renderStoryCard(story, false))}
          </div>
        )}
      </div>
    </div>
  );
}
