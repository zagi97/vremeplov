/**
 * Reusable skeleton components for loading states
 */

import { Skeleton } from '@/components/ui/skeleton';

/**
 * Card skeleton for photo cards
 */
export function CardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-lg">
      <Skeleton className="aspect-[4/3] bg-gray-200" />
      <div className="absolute bottom-0 left-0 p-4 w-full space-y-2">
        <Skeleton className="h-5 bg-gray-300 w-3/4" />
        <Skeleton className="h-4 bg-gray-300 w-1/2" />
      </div>
    </div>
  );
}

/**
 * Grid skeleton for photo grids
 *
 * @param count - Number of skeleton cards to display (default: 9)
 * @param columns - Number of columns in the grid (default: responsive grid)
 */
interface GridSkeletonProps {
  count?: number;
  columns?: 1 | 2 | 3 | 4;
}

export function GridSkeleton({ count = 9, columns }: GridSkeletonProps) {
  const gridClass = columns
    ? `grid grid-cols-${columns} gap-6`
    : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';

  return (
    <div className={gridClass}>
      {[...Array(count)].map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Page header skeleton
 */
export function PageHeaderSkeleton() {
  return (
    <div className="bg-white border-b border-gray-200 py-10 mt-16 shadow-sm">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <Skeleton className="h-10 w-64 mb-4" />
            <Skeleton className="h-5 w-48 mb-3" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
    </div>
  );
}

/**
 * Search and filter bar skeleton
 */
export function SearchFilterSkeleton() {
  return (
    <section className="py-6 px-4 bg-white border-b">
      <div className="container max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-4">
          <Skeleton className="flex-1 h-10" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </section>
  );
}

/**
 * Full page skeleton for location/gallery pages
 *
 * @param photoCount - Number of photo skeletons to show (default: 9)
 */
interface PageSkeletonProps {
  photoCount?: number;
  showHeader?: boolean;
  showSearch?: boolean;
}

export function PageSkeleton({
  photoCount = 9,
  showHeader = true,
  showSearch = true
}: PageSkeletonProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Page header skeleton */}
      {showHeader && <PageHeaderSkeleton />}

      {/* Search and filter skeleton */}
      {showSearch && <SearchFilterSkeleton />}

      {/* Photo grid skeleton */}
      <section className="py-12 px-4 flex-1 bg-[#F8F9FA]">
        <div className="container max-w-6xl mx-auto">
          <GridSkeleton count={photoCount} />
        </div>
      </section>
    </div>
  );
}

/**
 * List item skeleton (for comments, users, etc.)
 */
export function ListItemSkeleton() {
  return (
    <div className="flex items-start gap-3 p-4">
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  );
}

/**
 * List skeleton (for comments, users, etc.)
 *
 * @param count - Number of list items to show (default: 3)
 */
interface ListSkeletonProps {
  count?: number;
}

export function ListSkeleton({ count = 3 }: ListSkeletonProps) {
  return (
    <div className="divide-y divide-gray-200">
      {[...Array(count)].map((_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Table row skeleton
 */
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr>
      {[...Array(columns)].map((_, i) => (
        <td key={i} className="px-6 py-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

/**
 * Table skeleton
 */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <tbody className="divide-y divide-gray-200">
          {[...Array(rows)].map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
