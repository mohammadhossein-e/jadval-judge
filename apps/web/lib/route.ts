/**
 * Determines if a pathname matches a given href for active state detection.
 *
 * - Exact match for `/` (home)
 * - For other routes: exact match OR pathname starts with `href/`
 *   This prevents `/tournaments` from falsely matching `/tournament-details`.
 */
export function isActiveRoute(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}
