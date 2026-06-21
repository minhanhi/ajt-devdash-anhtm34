import { AppState } from './types';

// The single source of truth for the entire application state
const state: AppState = {
  status: 'idle',
  products: [],
  categories: [],
  selectedProduct: null,
  searchQuery: '',
  selectedCategory: '',
  sortBy: '',
  error: null,
};

type StateListener = (state: AppState) => void;
const listeners: StateListener[] = [];

/**
 * Returns a shallow copy of the current state.
 */
export function getState(): AppState {
  return { ...state };
}

/**
 * Updates the state with the provided partial values and triggers UI updates.
 */
export function updateState(newState: Partial<AppState>): void {
  Object.assign(state, newState);
  notifyListeners();
}

/**
 * Subscribes a listener function to run whenever the state changes.
 * Returns an unsubscribe function.
 */
export function subscribe(listener: StateListener): () => void {
  listeners.push(listener);
  // Run once immediately with current state to align UI
  listener(state);
  return () => {
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  };
}

/**
 * Notifies all registered listeners of the new state.
 */
function notifyListeners(): void {
  for (const listener of listeners) {
    listener({ ...state }); // Send a shallow copy to prevent direct state mutation by listeners
  }
}
