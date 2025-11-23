import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPublicPageContent, PAGE_CONTENT_EVENT } from "@/services/pageContentService";
import type { LocalizedSectionContent, PageContentStore } from "@/types/pageContent";

const PAGE_CONTENT_QUERY_KEY = ["page-content-public"] as const;

export function useSectionContent(sectionKey: string) {
  const queryClient = useQueryClient();
  const query = useQuery<PageContentStore>({
    queryKey: PAGE_CONTENT_QUERY_KEY,
    queryFn: fetchPublicPageContent,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ sectionKey?: string }>).detail;
      if (!detail?.sectionKey || detail.sectionKey === sectionKey) {
        queryClient.invalidateQueries({ queryKey: PAGE_CONTENT_QUERY_KEY });
      }
    };

    window.addEventListener(PAGE_CONTENT_EVENT, handler as EventListener);
    return () => window.removeEventListener(PAGE_CONTENT_EVENT, handler as EventListener);
  }, [queryClient, sectionKey]);

  return {
    content: (query.data?.[sectionKey] as LocalizedSectionContent | undefined) || null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
