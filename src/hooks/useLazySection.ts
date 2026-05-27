import { useState, useEffect, useRef } from 'react';

interface UseLazySectionOptions {
  threshold?: number;
  triggerOnce?: boolean;
  rootMargin?: string;
}

export const useLazySection = (options: UseLazySectionOptions = {}) => {
  const { 
    threshold = 0.1, 
    triggerOnce = true,
    rootMargin = '50px'
  } = options;
  
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );
    
    observer.observe(element);
    
    return () => observer.disconnect();
  }, [threshold, triggerOnce, rootMargin]);
  
  return { ref, isVisible };
};
