// src/components/admin/tabs/TagModerationTab.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { Users } from 'lucide-react';
import TagModerationCard from '../cards/TagModerationCard';
import { TaggedPerson } from '@/services/firebaseService';
import { ITEMS_PER_PAGE } from '@/constants';

interface TagModerationTabProps {
  adminUid: string;
  // ✅ Dodaj ove props
  pendingTags: TaggedPerson[];
  loading: boolean;
  tagPage: number;
  setTagPage: (page: number) => void;
  handleApproveTag: (tagId: string, adminUid: string) => void;
  handleRejectTag: (tagId: string) => void;
  handleEditTag: (tagId: string, updates: Partial<TaggedPerson>) => void;
}

export default function TagModerationTab({ 
  adminUid,
  pendingTags,
  loading,
  tagPage,
  setTagPage,
  handleApproveTag,
  handleRejectTag,
  handleEditTag,
}: TagModerationTabProps) {

  const TAGS_PER_PAGE = ITEMS_PER_PAGE.ADMIN_PHOTOS;
  const totalTagPages = Math.ceil(pendingTags.length / TAGS_PER_PAGE);
  const paginatedTags = pendingTags.slice(
    (tagPage - 1) * TAGS_PER_PAGE,
    tagPage * TAGS_PER_PAGE
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading tags...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">👥 Tagged Persons (Pending Review)</h2>
        <Badge variant="secondary">{pendingTags.length} pending</Badge>
      </div>

      {pendingTags.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground">No pending tags to review</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6">
            {paginatedTags.map((tag) => (
              <TagModerationCard
                key={tag.id}
                tag={tag}
                onApprove={() => handleApproveTag(tag.id!, adminUid)}
                onReject={() => handleRejectTag(tag.id!)}
                onEdit={(updates) => handleEditTag(tag.id!, updates)}
              />
            ))}
          </div>

          <Pagination
            currentPage={tagPage}
            totalPages={totalTagPages}
            onPageChange={setTagPage}
            totalItems={pendingTags.length}
            itemsPerPage={TAGS_PER_PAGE}
            itemName="tags"
          />
        </>
      )}
    </div>
  );
}