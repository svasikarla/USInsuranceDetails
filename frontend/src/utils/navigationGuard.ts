import { NextRouter } from 'next/router';

/**
 * Safe navigation utility to prevent duplicate navigation attempts
 */
export class NavigationGuard {
  private static pendingNavigations = new Set<string>();
  private static navigationTimeout = 100; // ms

  /**
   * Safely navigate to a route, preventing duplicate navigation attempts
   */
  static async safePush(router: NextRouter, url: string, options?: any): Promise<boolean> {
    // Check if we're already on the target URL
    if (router.asPath === url) {
      console.log(`NavigationGuard: Already on ${url}, skipping navigation`);
      return false;
    }

    // Check if navigation to this URL is already pending
    if (this.pendingNavigations.has(url)) {
      console.log(`NavigationGuard: Navigation to ${url} already pending, skipping`);
      return false;
    }

    try {
      // Mark navigation as pending
      this.pendingNavigations.add(url);

      // Perform the navigation
      await router.push(url, undefined, options);

      // Clear pending status after a short delay
      setTimeout(() => {
        this.pendingNavigations.delete(url);
      }, this.navigationTimeout);

      return true;
    } catch (error) {
      // Clear pending status on error
      this.pendingNavigations.delete(url);
      console.error(`NavigationGuard: Error navigating to ${url}:`, error);
      throw error;
    }
  }

  /**
   * Safely replace the current route
   */
  static async safeReplace(router: NextRouter, url: string, options?: any): Promise<boolean> {
    // Check if we're already on the target URL
    if (router.asPath === url) {
      console.log(`NavigationGuard: Already on ${url}, skipping replace`);
      return false;
    }

    // Check if navigation to this URL is already pending
    if (this.pendingNavigations.has(url)) {
      console.log(`NavigationGuard: Navigation to ${url} already pending, skipping replace`);
      return false;
    }

    try {
      // Mark navigation as pending
      this.pendingNavigations.add(url);

      // Perform the navigation
      await router.replace(url, undefined, options);

      // Clear pending status after a short delay
      setTimeout(() => {
        this.pendingNavigations.delete(url);
      }, this.navigationTimeout);

      return true;
    } catch (error) {
      // Clear pending status on error
      this.pendingNavigations.delete(url);
      console.error(`NavigationGuard: Error replacing with ${url}:`, error);
      throw error;
    }
  }

  /**
   * Clear all pending navigations (useful for cleanup)
   */
  static clearPending(): void {
    this.pendingNavigations.clear();
  }

  /**
   * Check if a navigation is pending
   */
  static isPending(url: string): boolean {
    return this.pendingNavigations.has(url);
  }
}

/**
 * Hook for safe navigation
 */
export function useSafeNavigation(router: NextRouter) {
  const safePush = (url: string, options?: any) => NavigationGuard.safePush(router, url, options);
  const safeReplace = (url: string, options?: any) => NavigationGuard.safeReplace(router, url, options);

  return { safePush, safeReplace };
}
