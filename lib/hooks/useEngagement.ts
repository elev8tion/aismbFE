import { useEffect, useRef } from 'react';

/**
 * Hook to track user engagement time on a specific component or page.
 * In a real app, this would send data to an analytics endpoint.
 * @param componentName Name of the component being tracked
 * @param data Additional metadata to log
 */
export function useEngagement(componentName: string, data?: Record<string, any>) {
  const startTime = useRef<number>(Date.now());

  useEffect(() => {
    startTime.current = Date.now();

    const handleUnmount = () => {
      const endTime = Date.now();
      const duration = (endTime - startTime.current) / 1000; // seconds

      if (duration > 2) { // Ignore fleeting interactions
        console.log(`[Analytics] User spent ${duration.toFixed(1)}s on ${componentName}`, data);
        // Future: sendToAnalyticsAPI({ component: componentName, duration, ...data });
      }
    };

    return handleUnmount;
  }, [componentName, data]);
}
