/**
 * Firebase-specific TypeScript types
 * Provides type safety for Firestore documents and operations
 */

import { Timestamp, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

/**
 * Firebase Timestamp or null/undefined
 * Used for optional timestamp fields
 */
export type FirebaseTimestamp = Timestamp | null | undefined;

/**
 * Firestore document with ID
 * Generic type that adds 'id' field to any document data
 */
export type WithId<T> = T & { id: string };

/**
 * Firestore document snapshot with typed data
 */
export type TypedDocumentSnapshot<T extends DocumentData> = QueryDocumentSnapshot<T>;

/**
 * Error type for catch blocks
 * Provides type-safe error handling
 */
export interface FirebaseError extends Error {
  code?: string;
  customData?: unknown;
}

/**
 * Type guard to check if error is Firebase error
 */
export function isFirebaseError(error: unknown): error is FirebaseError {
  return error instanceof Error;
}

/**
 * Safely extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (isFirebaseError(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

/**
 * Safely extract error code from Firebase error
 */
export function getErrorCode(error: unknown): string | undefined {
  if (isFirebaseError(error)) {
    return error.code;
  }
  return undefined;
}
