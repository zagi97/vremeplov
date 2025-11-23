// src/services/user/userTierService.ts - User tier management
import { UserTier, USER_TIER_LIMITS, USER_TIER_REQUIREMENTS } from '../../types/user.types';

/**
 * Odredi tier korisnika prema broju ODOBRENIH slika
 * @param approvedPhotosCount - Broj odobrenih slika
 * @returns UserTier enum
 */
export function getUserTier(approvedPhotosCount: number): UserTier {
  if (approvedPhotosCount >= USER_TIER_REQUIREMENTS[UserTier.POWER_USER]) {
    return UserTier.POWER_USER;
  }
  if (approvedPhotosCount >= USER_TIER_REQUIREMENTS[UserTier.CONTRIBUTOR]) {
    return UserTier.CONTRIBUTOR;
  }
  if (approvedPhotosCount >= USER_TIER_REQUIREMENTS[UserTier.VERIFIED]) {
    return UserTier.VERIFIED;
  }
  return UserTier.NEW_USER;
}

/**
 * Dohvati dnevni limit za tier
 */
export function getDailyLimitForTier(tier: UserTier): number {
  return USER_TIER_LIMITS[tier];
}

/**
 * Dohvati info o sljedećem tier-u
 * @param currentTier - Current user tier
 * @param approvedPhotos - Number of approved photos
 * @param t - Translation function (pass from useLanguage hook in component)
 */
export function getNextTierInfo(
  currentTier: UserTier,
  approvedPhotos: number,
  t: (key: string) => string
): string {
  let needed: number;

  if (currentTier === UserTier.NEW_USER) {
    needed = USER_TIER_REQUIREMENTS[UserTier.VERIFIED] - approvedPhotos;
    return t("upload.nextTierInfo.newUser").replace("{{needed}}", needed.toString());
  }

  if (currentTier === UserTier.VERIFIED) {
    needed = USER_TIER_REQUIREMENTS[UserTier.CONTRIBUTOR] - approvedPhotos;
    return t("upload.nextTierInfo.verified").replace("{{needed}}", needed.toString());
  }

  if (currentTier === UserTier.CONTRIBUTOR) {
    needed = USER_TIER_REQUIREMENTS[UserTier.POWER_USER] - approvedPhotos;
    return t("upload.nextTierInfo.contributor").replace("{{needed}}", needed.toString());
  }

  return t("upload.nextTierInfo.maxTier");
}
