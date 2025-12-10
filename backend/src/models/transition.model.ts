/**
 * Transition model and types
 */

export interface TransitionRequest {
  trackA: {
    id: string;
    name: string;
    artist?: string;
  };
  trackB: {
    id: string;
    name: string;
    artist?: string;
  };
  seconds?: number;
  style?: 'ambient' | 'lofi' | 'house' | 'cinematic';
  overrides?: {
    tempo?: number;
    energy?: number;
    speed?: number;
  };
}

export interface TransitionResponse {
  transitionId: string;
  url: string;
  cached: boolean;
}

export interface TransitionMetadata {
  transitionId: string;
  trackAId: string;
  trackBId: string;
  seconds: number;
  style: string;
  createdAt: number;
  filePath: string;
}


