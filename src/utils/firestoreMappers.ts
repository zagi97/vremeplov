/**
 * Generic Firestore document mapping utilities
 * Eliminates code duplication across the codebase
 */

import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

/**
 * Maps a Firestore document to a typed object with id
 *
 * @param doc - Firestore document snapshot
 * @returns Object with id and document data
 *
 * @example
 * const photos = snapshot.docs.map(mapDocumentWithId<Photo>);
 */
export function mapDocumentWithId<T extends DocumentData>(
  doc: QueryDocumentSnapshot<DocumentData>
): T & { id: string } {
  return {
    id: doc.id,
    ...doc.data()
  } as T & { id: string };
}

/**
 * Maps an array of Firestore documents to typed objects with ids
 *
 * @param docs - Array of Firestore document snapshots
 * @returns Array of objects with id and document data
 *
 * @example
 * const photos = mapDocumentsWithId<Photo>(snapshot.docs);
 */
export function mapDocumentsWithId<T extends DocumentData>(
  docs: QueryDocumentSnapshot<DocumentData>[]
): Array<T & { id: string }> {
  return docs.map(mapDocumentWithId<T>);
}

/**
 * Maps a Firestore document with a custom mapper function
 *
 * @param doc - Firestore document snapshot
 * @param mapper - Custom mapping function
 * @returns Mapped object
 *
 * @example
 * const photo = mapDocumentWith(doc, (data) => ({
 *   ...data,
 *   imageUrl: data.imageUrl || data.legacyUrl
 * }));
 */
export function mapDocumentWith<T extends DocumentData, R>(
  doc: QueryDocumentSnapshot<DocumentData>,
  mapper: (data: T & { id: string }) => R
): R {
  const baseData = mapDocumentWithId<T>(doc);
  return mapper(baseData);
}

/**
 * Filters and maps Firestore documents in one step
 *
 * @param docs - Array of Firestore document snapshots
 * @param predicate - Filter function
 * @returns Filtered and mapped array
 *
 * @example
 * const approvedPhotos = filterAndMapDocuments(
 *   snapshot.docs,
 *   (data) => data.isApproved === true
 * );
 */
export function filterAndMapDocuments<T extends DocumentData>(
  docs: QueryDocumentSnapshot<DocumentData>[],
  predicate: (data: T & { id: string }) => boolean
): Array<T & { id: string }> {
  return docs
    .map(mapDocumentWithId<T>)
    .filter(predicate);
}
