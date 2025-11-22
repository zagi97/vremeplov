// src/components/admin/tabs/ApprovedPhotosTab.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { Image } from 'lucide-react';
import PhotoManagementCard from '../cards/PhotoManagementCard';
import { ITEMS_PER_PAGE } from '@/constants';

interface ApprovedPhotosTabProps {
  approvedPhotos: any[];
  loading: boolean;
  approvedPhotoPage: number;
  setApprovedPhotoPage: (page: number) => void;
  handleEditPhoto: (photoId: string, updates: any) => void;
  handleDeletePhoto: (photoId: string, reason: string) => void;
}

export default function ApprovedPhotosTab({
  approvedPhotos,
  loading,
  approvedPhotoPage,
  setApprovedPhotoPage,
  handleEditPhoto,
  handleDeletePhoto,
}: ApprovedPhotosTabProps) {
  const PHOTOS_PER_PAGE = ITEMS_PER_PAGE.ADMIN_PHOTOS;
  const totalApprovedPages = Math.ceil(approvedPhotos.length / PHOTOS_PER_PAGE);
  const paginatedApprovedPhotos = approvedPhotos.slice(
    (approvedPhotoPage - 1) * PHOTOS_PER_PAGE,
    approvedPhotoPage * PHOTOS_PER_PAGE
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading approved photos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">✅ Approved Photos</h2>
        <Badge variant="secondary">{approvedPhotos.length} approved</Badge>
      </div>

      {approvedPhotos.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Image className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground">No approved photos yet</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6">
            {paginatedApprovedPhotos.map((photo) => (
              <PhotoManagementCard
                key={photo.id}
                photo={photo}
                onEdit={(updates) => handleEditPhoto(photo.id!, updates)}
                onDelete={(reason) => handleDeletePhoto(photo.id!, reason)}
              />
            ))}
          </div>

          <Pagination
            currentPage={approvedPhotoPage}
            totalPages={totalApprovedPages}
            onPageChange={setApprovedPhotoPage}
            totalItems={approvedPhotos.length}
            itemsPerPage={PHOTOS_PER_PAGE}
            itemName="photos"
          />
        </>
      )}
    </div>
  );
}
