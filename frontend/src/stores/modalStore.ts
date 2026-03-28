import { create } from 'zustand';

interface ModalState {
  slug: string | null;
  isOpen: boolean;
  openContentModal: (slug: string) => void;
  closeContentModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  slug: null,
  isOpen: false,
  openContentModal: (slug) => set({ slug, isOpen: true }),
  closeContentModal: () => set({ slug: null, isOpen: false }),
}));
