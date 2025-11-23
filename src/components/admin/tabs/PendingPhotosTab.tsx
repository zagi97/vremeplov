// src/components/admin/tabs/PendingPhotosTab.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { Image } from 'lucide-react';
import PhotoModerationCard from '../cards/PhotoModerationCard';
import { ITEMS_PER_PAGE } from '@/constants';

interface PendingPhotosTabProps {
  pendingPhotos: any[];
  loading: boolean;
  pendingPhotoPage: number;
  setPendingPhotoPage: (page: number) => void;
  handleApprovePhoto: (photoId: string) => void;
  handleRejectPhoto: (photoId: string, reason: string) => void;
  handleEditPhoto: (photoId: string, updates: any) => void;
}

export default function PendingPhotosTab({
  pendingPhotos,
  loading,
  pendingPhotoPage,
  setPendingPhotoPage,
  handleApprovePhoto,
  handleRejectPhoto,
  handleEditPhoto,
}: PendingPhotosTabProps) {
  const PHOTOS_PER_PAGE = ITEMS_PER_PAGE.ADMIN_PHOTOS;
  const totalPendingPages = Math.ceil(pendingPhotos.length / PHOTOS_PER_PAGE);
  const paginatedPendingPhotos = pendingPhotos.slice(
    (pendingPhotoPage - 1) * PHOTOS_PER_PAGE,
    pendingPhotoPage * PHOTOS_PER_PAGE
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading pending photos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">📸 Pending Photos</h2>
        <Badge variant="secondary">{pendingPhotos.length} pending</Badge>
      </div>

      {pendingPhotos.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Image className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground">No pending photos to review</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6">
            {paginatedPendingPhotos.map((photo) => (
              <PhotoModerationCard
                key={photo.id}
                photo={photo}
                onApprove={() => handleApprovePhoto(photo.id!)}
                onReject={(reason) => handleRejectPhoto(photo.id!, reason)}
                onEdit={(updates) => handleEditPhoto(photo.id!, updates)}
              />
            ))}
          </div>

          <Pagination
            currentPage={pendingPhotoPage}
            totalPages={totalPendingPages}
            onPageChange={setPendingPhotoPage}
            totalItems={pendingPhotos.length}
            itemsPerPage={PHOTOS_PER_PAGE}
            itemName="photos"
          />
        </>
      )}
    </div>
  );
}
