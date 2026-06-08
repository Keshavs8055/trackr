import { useRouter, usePathname } from 'next/navigation';
import { useFilterStore } from '@/store/filter-store';

export function useTagAction() {
  const router = useRouter();
  const pathname = usePathname();
  const { toggleTag } = useFilterStore();

  return (tag: string) => {
    toggleTag(tag);
    if (pathname !== '/') {
      router.push('/');
    }
  };
}
