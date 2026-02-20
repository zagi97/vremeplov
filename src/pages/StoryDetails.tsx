// src/pages/StoryDetails.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { ArrowLeft, MapPin, Calendar, User, Heart, Eye } from 'lucide-react';
import { storyService, Story, likeService, viewService } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import PageHeader from '@/components/PageHeader';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import LoadingScreen from '@/components/LoadingScreen';
import PhotoComments from '@/components/PhotoComments';
import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  limit as firestoreLimit,
  Timestamp,
  getDocsFromServer
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

const StoryDetails = () => {
  const { t } = useLanguage();
  const { storyId } = useParams<{ storyId: string }>();
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState(0);
  const [views, setViews] = useState(0);
  const [userHasLiked, setUserHasLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    const loadStory = async () => {
      if (!storyId) return;

      try {
        setLoading(true);
        const storyData = await storyService.getStoryById(storyId);
        setStory(storyData);

        if (storyData) {
          setLikes(storyData.likes || 0);
          setViews(storyData.views || 0);
        }
      } catch (error) {
        console.error('Error loading story:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStory();
  }, [storyId]);

  // Check if user liked this story
  useEffect(() => {
    const checkLike = async () => {
      if (!user || !storyId) return;
      try {
        const q = query(
          collection(db, 'storyLikes'),
          where('storyId', '==', storyId),
          where('userId', '==', user.uid),
          firestoreLimit(1)
        );
        const snapshot = await getDocsFromServer(q);
        setUserHasLiked(!snapshot.empty);
      } catch (error) {
        console.error('Error checking like:', error);
      }
    };

    checkLike();
  }, [user, storyId]);

  // Track view
  useEffect(() => {
    const trackView = async () => {
      if (!user || !storyId) return;
      try {
        const q = query(
          collection(db, 'storyViews'),
          where('storyId', '==', storyId),
          where('userId', '==', user.uid),
          firestoreLimit(1)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          await addDoc(collection(db, 'storyViews'), {
            storyId,
            userId: user.uid,
            createdAt: Timestamp.now()
          });
          // Increment view count
          const storyRef = doc(db, 'stories', storyId);
          const storySnap = await getDoc(storyRef);
          if (storySnap.exists()) {
            const currentViews = storySnap.data().views || 0;
            await updateDoc(storyRef, {
              views: currentViews + 1,
              updatedAt: Timestamp.now()
            });
            setViews(currentViews + 1);
          }
        }
      } catch (error) {
        console.error('Error tracking view:', error);
      }
    };

    trackView();
  }, [user, storyId]);

  const handleLike = async () => {
    if (!user || !storyId) return;
    setLikeLoading(true);

    try {
      const storyRef = doc(db, 'stories', storyId);

      if (userHasLiked) {
        // Unlike
        const q = query(
          collection(db, 'storyLikes'),
          where('storyId', '==', storyId),
          where('userId', '==', user.uid),
          firestoreLimit(1)
        );
        const snapshot = await getDocsFromServer(q);
        for (const docSnap of snapshot.docs) {
          await deleteDoc(docSnap.ref);
        }
        const newLikes = Math.max(0, likes - 1);
        await updateDoc(storyRef, { likes: newLikes, updatedAt: Timestamp.now() });
        setLikes(newLikes);
        setUserHasLiked(false);
      } else {
        // Like
        await addDoc(collection(db, 'storyLikes'), {
          storyId,
          userId: user.uid,
          createdAt: Timestamp.now()
        });
        const newLikes = likes + 1;
        await updateDoc(storyRef, { likes: newLikes, updatedAt: Timestamp.now() });
        setLikes(newLikes);
        setUserHasLiked(true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLikeLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('hr-HR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleBack = () => {
    if (window.history.length > 1 && document.referrer) {
      navigate(-1);
    } else if (story?.location) {
      navigate(`/location/${encodeURIComponent(story.location)}`);
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return <LoadingScreen message={t('stories.loadingStory')} />;
  }

  if (!story) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8F9FA] dark:bg-gray-900">
        <PageHeader title="Vremeplov.hr" />
        <div className="flex-1 flex items-center justify-center mt-16">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {t('stories.notFound')}
            </h2>
            <Button onClick={() => navigate('/')} className="mt-4">
              {t('photoDetail.returnHome')}
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] dark:bg-gray-900">
      <SEO
        title={story.title}
        description={story.content.slice(0, 160)}
        url={`/story/${storyId}`}
      />
      <PageHeader title="Vremeplov.hr" />

      <div className="mt-16 flex-1">
        {/* Back button */}
        <div className="container max-w-4xl mx-auto px-4 pt-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('stories.back')}
          </Button>
        </div>

        {/* Story content */}
        <article className="container max-w-4xl mx-auto px-4 pb-12">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6 sm:p-8">
              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                {story.title}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                <Link
                  to={`/location/${encodeURIComponent(story.location)}`}
                  className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                >
                  <MapPin className="h-4 w-4" />
                  {story.location}
                </Link>
                <Link
                  to={`/user/${story.authorId}`}
                  className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                >
                  <User className="h-4 w-4" />
                  {story.authorName}
                </Link>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(story.createdAt)}
                </span>
              </div>

              {/* Story body */}
              <div className="prose prose-gray dark:prose-invert max-w-none mb-8">
                {story.content.split('\n').map((paragraph, i) => (
                  paragraph.trim() ? (
                    <p key={i} className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                      {paragraph}
                    </p>
                  ) : null
                ))}
              </div>

              {/* Stats & Like */}
              <div className="flex items-center gap-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Eye className="h-4 w-4" />
                  {views} {t('photoDetail.views')}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Heart className={`h-4 w-4 ${userHasLiked ? 'fill-red-500 text-red-500' : ''}`} />
                  {likes} {t('photoDetail.likes')}
                </div>
                {user ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLike}
                    disabled={likeLoading}
                    className={`ml-auto ${userHasLiked ? 'text-red-500 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400' : 'dark:hover:bg-gray-700 dark:hover:text-gray-100'}`}
                  >
                    <Heart className={`h-4 w-4 mr-1 ${userHasLiked ? 'fill-red-500' : ''}`} />
                    {userHasLiked ? t('photoDetail.unlikePhoto') : t('photoDetail.likePhoto')}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={signInWithGoogle}
                    className="ml-auto"
                  >
                    {t('photoDetail.signInToLike')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <div className="mt-8">
            <PhotoComments photoId={storyId!} />
          </div>
        </article>
      </div>

      <Footer />
    </div>
  );
};

export default StoryDetails;
