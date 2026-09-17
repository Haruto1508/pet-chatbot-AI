import React, { lazy, ComponentType } from 'react';

/**
 * Wraps dynamic React.lazy imports with an automatic retry and reload mechanism.
 * When a new deployment occurs on Vercel/production, older chunk hashes are removed,
 * causing stale browser sessions to fail with "Failed to fetch dynamically imported module".
 * 
 * This helper detects chunk/module load failures, sets a session flag to avoid infinite loops,
 * and refreshes the window so the browser fetches the latest HTML and bundle hashes.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T } | any>
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    const pageHasAlreadyBeenReloaded = sessionStorage.getItem('chunk_retry_reloaded');

    try {
      const component = await componentImport();
      // Successful load - clear reload flag
      sessionStorage.removeItem('chunk_retry_reloaded');
      return typeof component === 'object' && component !== null && 'default' in component
        ? component
        : { default: component };
    } catch (error: any) {
      console.warn('Dynamic chunk import error detected:', error);

      const errorMessage = (error?.message || error?.toString() || '').toLowerCase();
      const isChunkError =
        errorMessage.includes('failed to fetch dynamically imported module') ||
        errorMessage.includes('loading chunk') ||
        errorMessage.includes('importing a module script failed') ||
        errorMessage.includes('failed to load module script');

      if (isChunkError && !pageHasAlreadyBeenReloaded) {
        sessionStorage.setItem('chunk_retry_reloaded', 'true');
        // Force reload without cache if possible
        window.location.reload();
        // Return pending promise so React Suspense remains suspended during the reload
        return new Promise(() => {});
      }

      // If already reloaded once and still failing (e.g. offline/network lost), clear flag and throw
      sessionStorage.removeItem('chunk_retry_reloaded');
      throw error;
    }
  });
}
