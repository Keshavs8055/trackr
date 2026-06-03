import { useRouter, usePathname } from 'next/navigation';
import { useFilterStore } from '@/store/filter-store';
import { useCollections } from '@/hooks/use-items';
import { formatTag } from '@/lib/parser';

export function useTagAction() {
  const router = useRouter();
  const pathname = usePathname();
  const { toggleTag } = useFilterStore();
  const { data: collections } = useCollections();

  return (tag: string) => {
    // 1. Check if a collection exists with this exact name
    const collection = collections?.find(c => formatTag(c.title) === tag);
    
    if (collection) {
      // Route to collection
      router.push(`/collections/${collection.id}`);
    } else {
      // Normal tag filtering
      toggleTag(tag);
      if (pathname !== '/' && !pathname.startsWith('/collections/')) {
        router.push('/');
      }
    }
  };
}
