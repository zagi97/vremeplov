// src/services/user/index.ts - Main user service aggregator
// This file provides a unified interface that maintains backward compatibility
// with the old monolithic userService while using the new modular structure

import { userProfileService } from './userProfileService';
import { userFollowService } from './userFollowService';
import { userActivityService } from './userActivityService';
import { userStatsService } from './userStatsService';
import { userBadgeService } from './userBadgeService';
import { userLeaderboardService } from './userLeaderboardService';
import { userModerationService } from './userModerationService';

// Re-export tier functions as named exports
export {
  getUserTier,
  getDailyLimitForTier,
  getNextTierInfo
} from './userTierService';

// Re-export all types
export * from '../../types/user.types';

// Re-export individual services for direct access
export {
  userProfileService,
  userFollowService,
  userActivityService,
  userStatsService,
  userBadgeService,
  userLeaderboardService,
  userModerationService
};

// Unified UserService class for backward compatibility
class UserService {
  // Profile methods
  createUserProfile = userProfileService.createUserProfile.bind(userProfileService);
  getUserProfile = userProfileService.getUserProfile.bind(userProfileService);
  updateUserProfile = userProfileService.updateUserProfile.bind(userProfileService);
  searchUsers = userProfileService.searchUsers.bind(userProfileService);
  subscribeToUserProfile = userProfileService.subscribeToUserProfile.bind(userProfileService);

  // Follow methods
  followUser = userFollowService.followUser.bind(userFollowService);
  unfollowUser = userFollowService.unfollowUser.bind(userFollowService);
  checkIfFollowing = userFollowService.checkIfFollowing.bind(userFollowService);
  getUserFollowers = userFollowService.getUserFollowers.bind(userFollowService);
  getUserFollowing = userFollowService.getUserFollowing.bind(userFollowService);

  // Activity methods
  addUserActivity = userActivityService.addUserActivity.bind(userActivityService);
  getUserActivities = userActivityService.getUserActivities.bind(userActivityService);
  getActivityFeed = userActivityService.getActivityFeed.bind(userActivityService);

  // Stats methods
  updateUserStats = userStatsService.updateUserStats.bind(userStatsService);
  forceRecalculateUserStats = userStatsService.forceRecalculateUserStats.bind(userStatsService);
  fixAllPhotoLikeCounts = userStatsService.fixAllPhotoLikeCounts.bind(userStatsService);
  recalculateAllUserStats = userStatsService.recalculateAllUserStats.bind(userStatsService);

  // Badge methods
  checkAndAwardBadges = userBadgeService.checkAndAwardBadges.bind(userBadgeService);
  getBadgeDefinitions = userBadgeService.getBadgeDefinitions.bind(userBadgeService);

  // Leaderboard methods
  getLeaderboard = userLeaderboardService.getLeaderboard.bind(userLeaderboardService);
  getCommunityStats = userLeaderboardService.getCommunityStats.bind(userLeaderboardService);
  getMonthlyHighlights = userLeaderboardService.getMonthlyHighlights.bind(userLeaderboardService);
  getYearlyHighlights = userLeaderboardService.getYearlyHighlights.bind(userLeaderboardService);

  // Moderation methods
  getAllUsersForAdmin = userModerationService.getAllUsersForAdmin.bind(userModerationService);
  suspendUser = userModerationService.suspendUser.bind(userModerationService);
  banUser = userModerationService.banUser.bind(userModerationService);
  unsuspendUser = userModerationService.unsuspendUser.bind(userModerationService);
  unbanUser = userModerationService.unbanUser.bind(userModerationService);
  checkUserStatus = userModerationService.checkUserStatus.bind(userModerationService);
  deleteUserAccount = userModerationService.deleteUserAccount.bind(userModerationService);
}

// Export singleton instance for backward compatibility
export const userService = new UserService();
