import { Nurse, EvaluationType } from '@/types';

const getStorageKey = (nurseId: string, evaluationType: EvaluationType) => 
  `inProgressEvaluation_${nurseId}_${evaluationType}`;

export interface InProgressEvaluation {
  nurse: Nurse;
  evaluationType: EvaluationType;
  scores: Record<string, number>;
  notes: string;
}

/**
 * Saves the current in-progress evaluation state to localStorage.
 * @param nurseId The ID of the nurse being evaluated.
 * @param evaluationType The type of the evaluation.
 * @param state The current state of the evaluation scores and notes.
 */
export const saveInProgressEvaluation = (
  nurseId: string,
  evaluationType: EvaluationType,
  state: Pick<InProgressEvaluation, 'scores' | 'notes'>
): void => {
  try {
    const key = getStorageKey(nurseId, evaluationType);
    const serializedState = JSON.stringify(state);
    localStorage.setItem(key, serializedState);
  } catch (error) {
    console.error('Error saving evaluation state to localStorage:', error);
  }
};

/**
 * Loads the in-progress evaluation state from localStorage.
 * @param nurseId The ID of the nurse being evaluated.
 * @param evaluationType The type of the evaluation.
 * @returns The saved state or null if nothing is saved or an error occurs.
 */
export const loadInProgressEvaluation = (
  nurseId: string,
  evaluationType: EvaluationType
): Pick<InProgressEvaluation, 'scores' | 'notes'> | null => {
  try {
    const key = getStorageKey(nurseId, evaluationType);
    const serializedState = localStorage.getItem(key);
    if (serializedState === null) {
      return null;
    }
    return JSON.parse(serializedState);
  } catch (error) {
    console.error('Error loading evaluation state from localStorage:', error);
    return null;
  }
};

/**
 * Clears the in-progress evaluation state from localStorage.
 * @param nurseId The ID of the nurse being evaluated.
 * @param evaluationType The type of the evaluation.
 */
export const clearInProgressEvaluation = (
  nurseId: string,
  evaluationType: EvaluationType
): void => {
  try {
    const key = getStorageKey(nurseId, evaluationType);
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing evaluation state from localStorage:', error);
  }
};
