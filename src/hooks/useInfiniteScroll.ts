import { useState, useCallback, useMemo, useEffect } from 'react';

interface UseInfiniteScrollOptions<T> {
  items: T[];
  pageSize?: number;
}

interface UseInfiniteScrollResult<T> {
  visibleItems: T[];
  loadMore: () => void;
  hasMore: boolean;
  loadedCount: number;
  totalCount: number;
  resetPagination: () => void;
}

export function useInfiniteScroll<T>({
  items,
  pageSize = 20
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollResult<T> {
  const [visibleCount, setVisibleCount] = useState(pageSize);

  // Reset pagination when items change (e.g., filters applied)
  useEffect(() => {
    setVisibleCount(pageSize);
  }, [items.length, pageSize]);

  const visibleItems = useMemo(() => {
    return items.slice(0, visibleCount);
  }, [items, visibleCount]);

  const hasMore = visibleCount < items.length;
  const totalCount = items.length;
  const loadedCount = Math.min(visibleCount, items.length);

  const loadMore = useCallback(() => {
    if (hasMore) {
      setVisibleCount(prev => Math.min(prev + pageSize, items.length));
    }
  }, [hasMore, pageSize, items.length]);

  const resetPagination = useCallback(() => {
    setVisibleCount(pageSize);
  }, [pageSize]);

  return {
    visibleItems,
    loadMore,
    hasMore,
    loadedCount,
    totalCount,
    resetPagination
  };
}

// Hook helper for scroll detection
export function useScrollLoadMore(
  containerRef: React.RefObject<HTMLDivElement>,
  loadMore: () => void,
  hasMore: boolean,
  threshold: number = 100
) {
  const handleScroll = useCallback(() => {
    if (!containerRef.current || !hasMore) return;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (scrollHeight - scrollTop - clientHeight < threshold) {
      loadMore();
    }
  }, [containerRef, loadMore, hasMore, threshold]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [containerRef, handleScroll]);
}

export default useInfiniteScroll;
