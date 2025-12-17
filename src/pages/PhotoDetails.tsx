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
  PhotoStats,
  PhotoMetadata,
  PhotoTagging
} from "@/components/PhotoDetails";
import LoadingScreen from "@/components/LoadingScreen";
import { usePhotoDetails } from "@/hooks/usePhotoDetails";
import { municipalityData } from "../../data/municipalities";
import { getCityType } from "@/utils/locationUtils";

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
    return <LoadingScreen message={t('photoDetail.loading')} />;
  }

  if (!photo) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t('photoDetail.notFound')}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{t('photoDetail.notFoundDesc')}</p>
          <Link to="/">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
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

  // ✅ Check if photo is pending approval
  const isPhotoPending = photo.isApproved === false;

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-900 flex flex-col">
      <PageHeader title="Vremeplov.hr" />

      <div className="container max-w-5xl mx-auto px-4 py-12 mt-20">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          {/* ✅ PENDING PHOTO WARNING */}
          {isPhotoPending && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 m-6">
              <div className="flex items-start gap-3">
                <svg className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium text-yellow-800 mb-1">
                    {t('photo.pendingTitle')}
                  </p>
                  <p className="text-sm text-yellow-700">
                    {t('photo.pendingMessage')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Photo Tagging Component */}
          <PhotoTagging
            photoId={photoId!}
            photoImageUrl={photo.imageUrl}
            photoDescription={photo.description}
            responsiveImages={photo.responsiveImages}
            photoAuthorId={photo.authorId}
            user={user}
            taggedPersons={taggedPersons.filter((tag): tag is typeof tag & { id: string } => tag.id !== undefined)}
            rateLimitInfo={rateLimitInfo}
            onAddTag={handleAddTag}
            onCheckRateLimit={checkUserTagRateLimit}
            MAX_TAGS_PER_PHOTO={MAX_TAGS_PER_PHOTO}
            MAX_TAGS_PER_HOUR={MAX_TAGS_PER_HOUR}
            MAX_TAGS_PER_DAY={MAX_TAGS_PER_DAY}
            isPhotoPending={isPhotoPending}
          />

          {/* Photo Stats Component */}
          <PhotoStats
            photoId={photoId!}
            views={views}
            likes={likes}
            taggedPersonsCount={taggedPersons.length}
            userHasLiked={userHasLiked}
            likeLoading={likeLoading}
            user={user}
            hasPendingTags={hasPendingTags}
            onLike={handleLike}
            isPhotoPending={isPhotoPending}
          />

          {/* Photo Metadata Component */}
          <PhotoMetadata
            year={parseInt(photo.year, 10)}
            author={photo.author}
            location={photo.location}
            uploadedBy={photo.uploadedBy}
            uploadedByUid={photo.authorId}
            uploadedAt={photo.uploadedAt}
            description={photo.description}
            detailedDescription={photo.detailedDescription}
            taggedPersons={taggedPersons.filter((tag): tag is typeof tag & { id: string } => tag.id !== undefined)}
          />

          {/* Comments Section */}
          <div className="p-6">
            <PhotoComments
              photoId={photoId!}
              photoAuthor={photo.uploadedBy || photo.author}
              photoAuthorId={photo.authorId}
              isPhotoPending={isPhotoPending}
            />
          </div>
        </div>

        {/* Related Photos Grid */}
        {relatedPhotos.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6 text-center md:text-left text-gray-900 dark:text-gray-100">
              {(() => {
                const cityType = getCityType(photo.location, municipalityData);
                if (cityType === 'Grad') {
                  return `${t('photoDetail.morePhotosFromCity')} ${photo.location}`;
                } else if (cityType === 'Općina') {
                  return `${t('photoDetail.morePhotosFromMunicipality')} ${photo.location}`;
                }
                return `${t('photoDetail.morePhotosFrom')} ${photo.location}`;
              })()}
            </h2>
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
