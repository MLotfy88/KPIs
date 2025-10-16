import { Nurse, EvaluationType } from '@/types';

const STORAGE_KEY = 'inProgressEvaluation';

export interface InProgressEvaluation {
  nurse?: Nurse;
  evaluationType?: EvaluationType;
  scores?: Record<string, number>;
  notes?: string;
  step?: 'SELECT_TYPE' | 'FILL_FORM';
}

/**
 * Saves the current in-progress evaluation state to localStorage.
 * @param state The current state of the evaluation.
 */
export const saveInProgressEvaluation = (state: InProgressEvaluation): void => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serializedState);
  } catch (error) {
    console.error('Error saving evaluation state to localStorage:', error);
  }
};

/**
 * Loads the in-progress evaluation state from localStorage.
 * @returns The saved state or null if nothing is saved or an error occurs.
 */
export const loadInProgressEvaluation = (): InProgressEvaluation | null => {
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY);
    if (serializedState === null) {
      return null;
    }
    return JSON.parse(serializedState) as InProgressEvaluation;
  } catch (error) {
    console.error('Error loading evaluation state from localStorage:', error);
    return null;
  }
};

/**
 * Clears the in-progress evaluation state from localStorage.
 */
export const clearInProgressEvaluation = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing evaluation state from localStorage:', error);
  }
};
