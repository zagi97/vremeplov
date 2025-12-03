// PhotoDetail.tsx
import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { ArrowLeft } from "lucide-react";
import PhotoGrid from "../components/PhotoGrid";
import PhotoComments from "../components/PhotoComments";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useNavigate } from 'react-router-dom';
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import LazyImage from "@/components/LazyImage";
import {
  PhotoDetailSkeleton,
  PhotoStats,
  PhotoMetadata,
  PhotoTagging
} from "@/components/PhotoDetails";
import { usePhotoDetails } from "@/hooks/usePhotoDetails";

const PhotoDetail = () => {
  const { t } = useLanguage();
  const { photoId } = useParams<{ photoId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    photo,
    relatedPhotos,
    loading,
    taggedPersons,
    likes,
    views,
    userHasLiked,
    likeLoading,
    rateLimitInfo,
    handleAddTag,
    handleLike,
    checkUserTagRateLimit,
    MAX_TAGS_PER_PHOTO,
    MAX_TAGS_PER_HOUR,
    MAX_TAGS_PER_DAY
  } = usePhotoDetails({ photoId, user, t });

  const handleBack = () => {
    if (window.history.length > 1 && document.referrer) {
      navigate(-1);
    } else {
      if (photo?.location) {
        navigate(`/location/${encodeURIComponent(photo.location)}`);
      } else {
        navigate('/');
      }
    }
  };

  if (loading) {
    return <PhotoDetailSkeleton />;
  }

  if (!photo) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('photoDetail.notFound')}</h2>
          <p className="text-gray-600 mb-4">{t('photoDetail.notFoundDesc')}</p>
          <Link to="/">
            <Button className="bg-blue-600 hover:bg-blue-700">
              {t('photoDetail.returnHome')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const hasPendingTags = taggedPersons.some(
    tag => tag.isApproved === false && tag.addedByUid === user?.uid
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <PageHeader title="Vremeplov.hr" />

      <div className="container max-w-5xl mx-auto px-4 py-12 mt-20">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Photo Tagging Component */}
          <PhotoTagging
            photoId={photoId!}
            photoImageUrl={photo.imageUrl}
            photoDescription={photo.description}
            responsiveImages={photo.responsiveImages}
            photoAuthorId={photo.authorId}
            user={user}
            taggedPersons={taggedPersons}
            rateLimitInfo={rateLimitInfo}
            onAddTag={handleAddTag}
            onCheckRateLimit={checkUserTagRateLimit}
            MAX_TAGS_PER_PHOTO={MAX_TAGS_PER_PHOTO}
            MAX_TAGS_PER_HOUR={MAX_TAGS_PER_HOUR}
            MAX_TAGS_PER_DAY={MAX_TAGS_PER_DAY}
          />

          {/* Photo Stats Component */}
          <PhotoStats
            views={views}
            likes={likes}
            taggedPersonsCount={taggedPersons.length}
            userHasLiked={userHasLiked}
            likeLoading={likeLoading}
            user={user}
            hasPendingTags={hasPendingTags}
            onLike={handleLike}
          />

          {/* Photo Metadata Component */}
          <PhotoMetadata
            year={photo.year}
            author={photo.author}
            location={photo.location}
            uploadedBy={photo.uploadedBy}
            uploadedAt={photo.uploadedAt}
            description={photo.description}
            detailedDescription={photo.detailedDescription}
            taggedPersons={taggedPersons}
          />

          {/* Comments Section */}
          <div className="p-6">
            <PhotoComments
              photoId={photoId!}
              photoAuthor={photo.uploadedBy || photo.author}
              photoAuthorId={photo.authorId}
            />
          </div>
        </div>

        {/* Related Photos Grid */}
        {relatedPhotos.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">{t('photoDetail.morePhotosFrom')} {photo.location}</h2>
            <PhotoGrid
              photos={relatedPhotos}
              currentPhotoId={photoId}
            />
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default PhotoDetail;
