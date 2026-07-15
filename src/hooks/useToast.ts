import { useCallback, useEffect, useRef, useState } from 'react';

export function useToast(duration = 2200) {
  const [message, setMessage] = useState('');
  const timer = useRef<number | undefined>(undefined);
  const showToast = useCallback((text: string) => {
    setMessage(text);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMessage(''), duration);
  }, [duration]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return { message, showToast };
}
