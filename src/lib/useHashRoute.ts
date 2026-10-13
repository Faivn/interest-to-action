import { useCallback, useEffect, useState } from 'react';

function currentPath(): string {
  const hash = window.location.hash.replace(/^#/, '');
  return hash.startsWith('/') ? hash : '';
}

/**
 * Minimal hash routing: refresh-safe, back-button friendly, no server configuration.
 * Paths look like "/plans" or "/plans/123".
 */
export function useHashRoute(): [string, (path: string, options?: { replace?: boolean }) => void] {
  const [path, setPath] = useState(currentPath);

  useEffect(() => {
    const onChange = () => setPath(currentPath());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((next: string, options?: { replace?: boolean }) => {
    const url = `#${next}`;
    if (options?.replace) window.history.replaceState(null, '', url);
    else window.history.pushState(null, '', url);
    setPath(next);
  }, []);

  return [path, navigate];
}
