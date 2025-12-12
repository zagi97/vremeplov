/**
 * Profile Badges Component
 * Displays user badges earned through achievements
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { getBadgeDetails } from '@/utils/userProfileHelpers';
import { Award } from 'lucide-react';
import EmptyState from '../EmptyState';

interface ProfileBadgesProps {
  badges: string[];
  t: (key: string) => string;
}

export const ProfileBadges: React.FC<ProfileBadgesProps> = ({ badges, t }) => {
  if (!badges || badges.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('profile.achievements')}</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Award}
            title={t('profile.noBadges')}
            description={t('profile.noBadgesDesc')}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('profile.achievements')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {badges.map((badgeId) => {
            const badge = getBadgeDetails(badgeId, t);
            const Icon = badge.icon;
            return (
              <div
                key={badgeId}
                className={`${badge.color} text-white p-3 rounded-lg text-center`}
              >
                <Icon className="h-6 w-6 mx-auto mb-1" />
                <p className="text-xs font-medium">{badge.name}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
