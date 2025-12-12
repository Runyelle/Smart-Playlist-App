/**
 * Transition status tracking service
 * Tracks the status of transition generation requests in-memory
 * Used for status endpoint to check if a transition is ready
 */

export type TransitionStatus = 'PENDING' | 'READY' | 'FAILED';

export interface TransitionStatusData {
  status: TransitionStatus;
  transitionId: string;
  createdAt: number;
  completedAt?: number;
  error?: string;
}

/**
 * In-memory store for transition statuses
 * Key: transitionId, Value: status data
 */
const statusStore = new Map<string, TransitionStatusData>();

/**
 * Set transition status
 */
export function setTransitionStatus(
  transitionId: string,
  status: TransitionStatus,
  error?: string
): void {
  const existing = statusStore.get(transitionId);
  const now = Date.now();

  statusStore.set(transitionId, {
    status,
    transitionId,
    createdAt: existing?.createdAt || now,
    completedAt: status === 'READY' || status === 'FAILED' ? now : undefined,
    error,
  });
}

/**
 * Get transition status
 */
export function getTransitionStatus(
  transitionId: string
): TransitionStatusData | null {
  return statusStore.get(transitionId) || null;
}

/**
 * Mark transition as ready
 */
export function markTransitionReady(transitionId: string): void {
  setTransitionStatus(transitionId, 'READY');
}

/**
 * Mark transition as failed
 */
export function markTransitionFailed(transitionId: string, error: string): void {
  setTransitionStatus(transitionId, 'FAILED', error);
}

/**
 * Clean up old status entries (older than 24 hours)
 * Call this periodically to prevent memory leaks
 */
export function cleanupOldStatuses(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
  const now = Date.now();
  const toDelete: string[] = [];

  for (const [transitionId, data] of statusStore.entries()) {
    if (now - data.createdAt > maxAgeMs) {
      toDelete.push(transitionId);
    }
  }

  for (const transitionId of toDelete) {
    statusStore.delete(transitionId);
  }
}

