import { create } from "zustand";

interface LegacyAvatarState {
  isSpeaking: boolean;
  activeEmotion: string;
  isCompanionOpen: boolean;
  currentMessage: string;
  setSpeaking: (s: boolean) => void;
  setEmotion: (e: string) => void;
  setCompanionOpen: (o: boolean) => void;
  setMessage: (m: string) => void;
  triggerEvent: (event: string, meta?: any) => void;
}

export const useAvatarStore = create<LegacyAvatarState>((set) => ({
  isSpeaking: false,
  activeEmotion: "neutral",
  isCompanionOpen: false,
  currentMessage: "",
  setSpeaking: (isSpeaking) => set({ isSpeaking }),
  setEmotion: (activeEmotion) => set({ activeEmotion }),
  setCompanionOpen: (isCompanionOpen) => set({ isCompanionOpen }),
  setMessage: (currentMessage) => set({ currentMessage }),
  triggerEvent: () => {},
}));
