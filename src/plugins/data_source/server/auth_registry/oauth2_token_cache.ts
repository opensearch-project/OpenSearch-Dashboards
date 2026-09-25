/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

interface OAuth2TokenCacheEntry {
  token: string;
  expiresAt: number;
}

/**
 * OAuth2 token cache manager that handles token storage, expiration, and cleanup
 * This replaces the module-level singleton to improve testability and prevent state leakage
 */
export class OAuth2TokenCache {
  private tokenCache = new Map<string, OAuth2TokenCacheEntry>();
  private inFlight = new Map<string, Promise<string>>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize the token cleanup scheduler
   */
  initialize(): void {
    if (this.cleanupInterval) {
      return; // Already initialized
    }

    // Clean up expired tokens every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupExpiredTokens();
      },
      5 * 60 * 1000
    );
  }

  /**
   * Dispose of the token cleanup scheduler and clear all tokens
   */
  dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.tokenCache.clear();
    this.inFlight.clear();
  }

  /**
   * Runs `fetchToken` at most once per cache key at a time. A dashboard renders many
   * panels against the same data source concurrently; without this every panel would
   * miss the empty cache and fire its own token request, which wastes round trips and
   * trips IdP rate limits. Callers that arrive while a fetch is in progress await the
   * same promise and share its result.
   *
   * The in-flight entry is removed as soon as the fetch settles, so a failure does not
   * poison later attempts.
   */
  async getOrFetchToken(cacheKey: string, fetchToken: () => Promise<string>): Promise<string> {
    const pending = this.inFlight.get(cacheKey);
    if (pending) {
      return pending;
    }

    const request = fetchToken().finally(() => {
      this.inFlight.delete(cacheKey);
    });
    this.inFlight.set(cacheKey, request);

    return request;
  }

  /**
   * Get a cached token if it exists and is not expired
   */
  getToken(cacheKey: string): string | null {
    const cachedToken = this.tokenCache.get(cacheKey);
    if (cachedToken && cachedToken.expiresAt > Date.now()) {
      return cachedToken.token;
    }

    // Remove expired token
    if (cachedToken) {
      this.tokenCache.delete(cacheKey);
    }

    return null;
  }

  /**
   * Store a token with expiration time
   */
  setToken(cacheKey: string, token: string, expiresAt: number): void {
    this.tokenCache.set(cacheKey, {
      token,
      expiresAt,
    });
  }

  /**
   * Clear a specific cached token
   */
  clearToken(cacheKey: string): void {
    this.tokenCache.delete(cacheKey);
  }

  /**
   * Clean up expired tokens
   */
  private cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [key, cache] of this.tokenCache.entries()) {
      if (cache.expiresAt <= now) {
        this.tokenCache.delete(key);
      }
    }
  }
}
