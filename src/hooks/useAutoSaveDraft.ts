import { useEffect, useCallback, useRef } from 'react';

interface UseAutoSaveDraftOptions<T> {
  key: string;
  data: T;
  debounceMs?: number;
}

export function useAutoSaveDraft<T>({ key, data, debounceMs = 1000 }: UseAutoSaveDraftOptions<T>) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Save to localStorage with debounce
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (error) {
        console.error('Failed to save draft:', error);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [key, data, debounceMs]);

  // Load saved draft
  const loadDraft = useCallback((): T | null => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        return JSON.parse(saved) as T;
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
    return null;
  }, [key]);

  // Clear saved draft
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, [key]);

  return { loadDraft, clearDraft };
}
