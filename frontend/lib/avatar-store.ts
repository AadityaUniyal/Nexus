import { create } from 'zustand';

export type AvatarMood =
  | 'IDLE'
  | 'WELCOME'
  | 'FOCUSED'
  | 'WARNING'
  | 'CRITICAL'
  | 'THINKING'
  | 'SIMULATING'
  | 'SUCCESS'
  | 'ERROR'
  | 'EMPTY'
  | 'OFFLINE';

const MOOD_PRIORITY: Record<AvatarMood, number> = {
  CRITICAL: 10,
  ERROR: 9,
  WARNING: 8,
  SIMULATING: 7,
  THINKING: 6,
  SUCCESS: 5,
  FOCUSED: 4,
  WELCOME: 3,
  EMPTY: 2,
  OFFLINE: 1,
  IDLE: 0,
};

interface AvatarStoreState {
  mood: AvatarMood;
  temporaryMoodTimeout: NodeJS.Timeout | null;
  setMood: (mood: AvatarMood, durationMs?: number) => void;
  triggerEvent: (
    eventType:
      | 'APP_READY'
      | 'FIRST_LOGIN'
      | 'ONBOARDING_STEP_COMPLETED'
      | 'WORLD_ENTITY_SELECTED'
      | 'CRITICAL_INCIDENT'
      | 'SIMULATION_QUEUED'
      | 'SIMULATION_RUNNING'
      | 'SIMULATION_COMPLETED'
      | 'SIMULATION_FAILED'
      | 'DECISION_APPLIED'
      | 'API_ERROR'
      | 'OFFLINE'
      | 'EMPTY_STATE'
      | 'AI_REQUEST'
      | 'AI_RESPONSE'
      | 'VOICE_LISTENING'
      | 'VOICE_SPEAKING'
      | 'IDLE'
  ) => void;
  resetToIdle: () => void;
}

export const useAvatarStore = create<AvatarStoreState>((set, get) => ({
  mood: 'IDLE',
  temporaryMoodTimeout: null,

  setMood: (newMood: AvatarMood, durationMs?: number) => {
    const current = get().mood;
    const currentPriority = MOOD_PRIORITY[current];
    const newPriority = MOOD_PRIORITY[newMood];

    // If new mood is lower priority and current is active, ignore unless duration passed
    if (newPriority < currentPriority && current !== 'IDLE') {
      return;
    }

    if (get().temporaryMoodTimeout) {
      clearTimeout(get().temporaryMoodTimeout!);
    }

    let timeout: NodeJS.Timeout | null = null;
    if (durationMs && durationMs > 0) {
      timeout = setTimeout(() => {
        set({ mood: 'IDLE', temporaryMoodTimeout: null });
      }, durationMs);
    }

    set({ mood: newMood, temporaryMoodTimeout: timeout });
  },

  triggerEvent: (eventType) => {
    const { setMood } = get();
    switch (eventType) {
      case 'APP_READY':
      case 'IDLE':
        setMood('IDLE');
        break;
      case 'FIRST_LOGIN':
        setMood('WELCOME', 4000);
        break;
      case 'ONBOARDING_STEP_COMPLETED':
        setMood('SUCCESS', 2500);
        break;
      case 'WORLD_ENTITY_SELECTED':
        setMood('FOCUSED', 3000);
        break;
      case 'CRITICAL_INCIDENT':
        setMood('CRITICAL');
        break;
      case 'SIMULATION_QUEUED':
        setMood('THINKING');
        break;
      case 'SIMULATION_RUNNING':
        setMood('SIMULATING');
        break;
      case 'SIMULATION_COMPLETED':
        setMood('SUCCESS', 4000);
        break;
      case 'SIMULATION_FAILED':
        setMood('ERROR', 4000);
        break;
      case 'DECISION_APPLIED':
        setMood('SUCCESS', 5000);
        break;
      case 'API_ERROR':
        setMood('ERROR', 3000);
        break;
      case 'OFFLINE':
        setMood('OFFLINE');
        break;
      case 'EMPTY_STATE':
        setMood('EMPTY');
        break;
      case 'AI_REQUEST':
      case 'VOICE_LISTENING':
        setMood('THINKING');
        break;
      case 'AI_RESPONSE':
      case 'VOICE_SPEAKING':
        setMood('FOCUSED', 3500);
        break;
      default:
        setMood('IDLE');
    }
  },

  resetToIdle: () => {
    if (get().temporaryMoodTimeout) {
      clearTimeout(get().temporaryMoodTimeout!);
    }
    set({ mood: 'IDLE', temporaryMoodTimeout: null });
  },
}));
