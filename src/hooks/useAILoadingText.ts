import { useState, useEffect } from 'react';

const LOADING_PHRASES = [
  "Detecting routes...",
  "Analyzing historical patterns...",
  "Evaluating crowd density...",
  "Formulating insights...",
  "Finalizing recommendations..."
];

export function useAILoadingText(isLoading: boolean, intervalMs: number = 2000) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % LOADING_PHRASES.length);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isLoading, intervalMs]);

  return LOADING_PHRASES[index];
}
