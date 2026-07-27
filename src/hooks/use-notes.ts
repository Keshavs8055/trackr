import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NoteService } from '@/services/note-service';
import { useAuth } from '@/components/auth-provider';
import { ResourceNote } from '@/types';

export function useResourceNotes(resourceId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['resource-notes', user?.uid, resourceId],
    queryFn: async () => {
      if (!user?.uid || !resourceId) return [];
      return NoteService.getInstance().getNotes(user.uid, resourceId);
    },
    enabled: !!user?.uid && !!resourceId,
    staleTime: 60 * 1000,
  });
}

export function useAddNote() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ resourceId, title, content }: { resourceId: string; title: string; content: string }) => {
      if (!user?.uid) throw new Error("Authentication required");
      return NoteService.getInstance().addNote(user.uid, resourceId, title, content);
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['resource-notes', user?.uid, vars.resourceId] });
      queryClient.invalidateQueries({ queryKey: ['resource-backlinks'] });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      resourceId,
      noteId,
      updates,
    }: {
      resourceId: string;
      noteId: string;
      updates: Partial<Pick<ResourceNote, 'title' | 'content'>>;
    }) => {
      if (!user?.uid) throw new Error("Authentication required");
      return NoteService.getInstance().updateNote(user.uid, resourceId, noteId, updates);
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['resource-notes', user?.uid, vars.resourceId] });
      queryClient.invalidateQueries({ queryKey: ['resource-backlinks'] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ resourceId, noteId }: { resourceId: string; noteId: string }) => {
      if (!user?.uid) throw new Error("Authentication required");
      return NoteService.getInstance().deleteNote(user.uid, resourceId, noteId);
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['resource-notes', user?.uid, vars.resourceId] });
      queryClient.invalidateQueries({ queryKey: ['resource-backlinks'] });
    },
  });
}

export function useResourceBacklinks(resourceTitle?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['resource-backlinks', user?.uid, resourceTitle],
    queryFn: async () => {
      if (!user?.uid || !resourceTitle) return [];
      return NoteService.getInstance().findBacklinks(user.uid, resourceTitle);
    },
    enabled: !!user?.uid && !!resourceTitle,
    staleTime: 60 * 1000,
  });
}
