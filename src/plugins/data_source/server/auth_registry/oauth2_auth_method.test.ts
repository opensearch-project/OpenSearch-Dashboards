/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createOAuth2AuthMethod, createOAuth2CredentialsProvider } from './oauth2_auth_method';
import { OAuth2TokenCache } from './oauth2_token_cache';
import { AuthType } from '../../common/data_sources';

// Mock dns module to avoid real DNS lookups in tests. The token URL fixtures use
// hostnames that do not resolve (auth.example.com is NXDOMAIN), so without this the
// SSRF check in endpoint_validator fails every token fetch.
jest.mock('dns', () => ({
  promises: {
    lookup: jest.fn(async (hostname: string) => {
      if (hostname === '127.0.0.1') {
        return { address: '127.0.0.1', family: 4 };
      }
      return { address: '1.2.3.4', family: 4 };
    }),
  },
}));

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock setTimeout and clearInterval for token cleanup tests
jest.useFakeTimers();

// Mock setInterval and clearInterval
const mockSetInterval = jest.fn();
const mockClearInterval = jest.fn();
const mockSetTimeout = jest.fn();

/** The abort deadline the credential provider arms around each token request. */
const ABORT_TIMEOUT_MS = 10000;

// Kept so the real timers can be put back; leaving these stubs in place would hand broken
// timers to anything else that runs in this worker.
const realSetInterval = global.setInterval;
const realClearInterval = global.clearInterval;
const realSetTimeout = global.setTimeout;

// @ts-ignore
global.setInterval = mockSetInterval;
// @ts-ignore
global.clearInterval = mockClearInterval;
// @ts-ignore
global.setTimeout = mockSetTimeout;

afterAll(() => {
  global.setInterval = realSetInterval;
  global.clearInterval = realClearInterval;
  global.setTimeout = realSetTimeout;
});

describe('OAuth2 Authentication Method', () => {
  let mockCryptography: any;
  let baseDataSourceAttr: any;
  let mockOptions: any;
  let tokenCache: OAuth2TokenCache;
  let oauth2CredentialsProvider: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();

    // Reset all mocks completely
    mockFetch.mockReset();
    mockSetInterval.mockReset();
    // OAuth2TokenCache stores the handle and guards on its truthiness, so the mock has to
    // return something truthy for initialize()/dispose() to behave as they do at runtime.
    mockSetInterval.mockReturnValue(123);
    mockClearInterval.mockReset();
    mockSetTimeout.mockReset();

    // Re-apply after the reset above: the retry logic awaits a setTimeout delay, so a
    // no-op setTimeout leaves those promises pending and the test times out.
    //
    // The abort deadline is deliberately left pending. Invoking it would call
    // controller.abort() before fetch is reached, so every request would begin already
    // aborted and the tests would be describing a state that cannot occur at runtime.
    mockSetTimeout.mockImplementation((callback: () => void, delay?: number) => {
      if (delay !== ABORT_TIMEOUT_MS) {
        callback();
      }
      return {};
    });

    // Create fresh token cache and credentials provider for each test
    tokenCache = new OAuth2TokenCache();
    oauth2CredentialsProvider = createOAuth2CredentialsProvider(tokenCache);

    // The credential provider always decrypts the stored client secret when a cryptography
    // service is supplied, so the default stub returns a valid result signed with the
    // fixture endpoint. Tests covering decryption failures override this.
    mockCryptography = {
      decodeAndDecrypt: jest.fn().mockResolvedValue({
        decryptedText: 'test-client-secret',
        encryptionContext: { endpoint: 'https://test-endpoint.com' },
      }),
    };

    baseDataSourceAttr = {
      title: 'Test OAuth2 Data Source',
      endpoint: 'https://test-endpoint.com',
      dataSourceVersion: '1.0.0',
      auth: {
        type: AuthType.OAuth2,
        credentials: {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          tokenUrl: 'https://auth.example.com/token',
          scopes: 'read write',
          audience: 'https://api.example.com',
          grantType: 'client_credentials',
        },
      },
    };

    mockOptions = {
      dataSourceAttr: baseDataSourceAttr,
      cryptography: mockCryptography,
    };
  });

  afterEach(() => {
    tokenCache.dispose();
  });

  describe('createOAuth2AuthMethod', () => {
    it('should create auth method with correct name and credential provider', () => {
      const oauth2AuthMethod = createOAuth2AuthMethod(tokenCache);
      expect(oauth2AuthMethod.name).toBe(AuthType.OAuth2);
      expect(typeof oauth2AuthMethod.credentialProvider).toBe('function');
    });

    it('should validate token URL to prevent SSRF attacks', async () => {
      // endpointDeniedIPs entries are CIDR ranges - IPCIDR rejects a bare address.
      const oauth2AuthMethod = createOAuth2AuthMethod(
        tokenCache,
        ['127.0.0.1/32'],
        ['example.com']
      );

      const maliciousOptions = {
        ...mockOptions,
        dataSourceAttr: {
          ...baseDataSourceAttr,
          auth: {
            ...baseDataSourceAttr.auth,
            credentials: {
              ...baseDataSourceAttr.auth.credentials,
              tokenUrl: 'https://127.0.0.1/token', // Should be blocked
            },
          },
        },
      };

      await expect(oauth2AuthMethod.credentialProvider(maliciousOptions)).rejects.toThrow(
        'OAuth2 token URL validation failed'
      );
    });

    it('should allow valid token URLs', async () => {
      const oauth2AuthMethod = createOAuth2AuthMethod(
        tokenCache,
        ['127.0.0.1/32'],
        ['example.com']
      );

      const validOptions = {
        ...mockOptions,
        dataSourceAttr: {
          ...baseDataSourceAttr,
          auth: {
            ...baseDataSourceAttr.auth,
            credentials: {
              ...baseDataSourceAttr.auth.credentials,
              tokenUrl: 'https://auth.example.com/token', // Should be allowed
            },
          },
        },
      };

      const mockTokenResponse = {
        access_token: 'valid-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse),
      });

      const result = await oauth2AuthMethod.credentialProvider(validOptions);
      expect(result.credentials.token).toBe('valid-token');
    });
  });

  describe('Token Cache Management', () => {
    describe('Cache Hit Scenarios', () => {
      it('should return cached token when valid token exists', async () => {
        const mockTokenResponse = {
          access_token: 'cached-token-123',
          token_type: 'Bearer',
          expires_in: 3600,
        };

        // First call to populate cache
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse),
        });

        const firstResult = await oauth2CredentialsProvider(mockOptions);
        expect(firstResult.credentials.token).toBe('cached-token-123');

        // Second call should use cached token (no fetch call)
        mockFetch.mockClear();
        const secondResult = await oauth2CredentialsProvider(mockOptions);

        expect(mockFetch).not.toHaveBeenCalled();
        expect(secondResult.credentials.token).toBe('cached-token-123');
        expect(secondResult.cacheKeySuffix).toContain('oauth2:');
      });

      it('should use cached token for same configuration parameters', async () => {
        const mockTokenResponse = {
          access_token: 'shared-token-456',
          token_type: 'Bearer',
          expires_in: 3600,
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse),
        });

        // First call
        await oauth2CredentialsProvider(mockOptions);

        // Second call with identical configuration should use cache
        mockFetch.mockClear();
        const result = await oauth2CredentialsProvider({
          ...mockOptions,
          dataSourceAttr: { ...baseDataSourceAttr },
        });

        expect(mockFetch).not.toHaveBeenCalled();
        expect(result.credentials.token).toBe('shared-token-456');
      });
    });

    describe('Cache Miss Scenarios', () => {
      it('should fetch new token when no cached token exists', async () => {
        const mockTokenResponse = {
          access_token: 'new-token-789',
          token_type: 'Bearer',
          expires_in: 3600,
        };

        // beforeEach already constructs a fresh OAuth2TokenCache, so the cache is empty here.
        mockFetch.mockClear();

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse),
        });

        const result = await oauth2CredentialsProvider(mockOptions);

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(result.credentials.token).toBe('new-token-789');
      });

      it('should fetch separate tokens for different configurations', async () => {
        const mockTokenResponse1 = {
          access_token: 'token-config-1',
          token_type: 'Bearer',
          expires_in: 3600,
        };

        const mockTokenResponse2 = {
          access_token: 'token-config-2',
          token_type: 'Bearer',
          expires_in: 3600,
        };

        // First configuration
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse1),
        });

        const result1 = await oauth2CredentialsProvider(mockOptions);

        // Second configuration with different client ID
        const differentOptions = {
          ...mockOptions,
          dataSourceAttr: {
            ...baseDataSourceAttr,
            auth: {
              ...baseDataSourceAttr.auth,
              credentials: {
                ...baseDataSourceAttr.auth.credentials,
                clientId: 'different-client-id',
              },
            },
          },
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse2),
        });

        const result2 = await oauth2CredentialsProvider(differentOptions);

        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(result1.credentials.token).toBe('token-config-1');
        expect(result2.credentials.token).toBe('token-config-2');
      });

      it('should fetch a new token when the client secret is rotated', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              access_token: 'token-old-secret',
              token_type: 'Bearer',
              expires_in: 3600,
            }),
        });

        const before = await oauth2CredentialsProvider(mockOptions);
        expect(before.credentials.token).toBe('token-old-secret');

        // Same clientId, tokenUrl, scopes, audience and endpoint - only the secret differs.
        // A secret is usually rotated because the old one leaked, so continuing to serve a
        // token minted with it would defeat the rotation.
        const rotatedOptions = {
          ...mockOptions,
          dataSourceAttr: {
            ...baseDataSourceAttr,
            auth: {
              ...baseDataSourceAttr.auth,
              credentials: {
                ...baseDataSourceAttr.auth.credentials,
                clientSecret: 'rotated-client-secret',
              },
            },
          },
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              access_token: 'token-new-secret',
              token_type: 'Bearer',
              expires_in: 3600,
            }),
        });

        const after = await oauth2CredentialsProvider(rotatedOptions);

        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(after.credentials.token).toBe('token-new-secret');
      });
    });

    describe('Cache Expiry Scenarios', () => {
      it('should fetch new token when cached token is expired', async () => {
        const expiredTokenResponse = {
          access_token: 'expired-token',
          token_type: 'Bearer',
          expires_in: 1, // 1 second
        };

        const newTokenResponse = {
          access_token: 'fresh-token',
          token_type: 'Bearer',
          expires_in: 3600,
        };

        // First call with short-lived token
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(expiredTokenResponse),
        });

        await oauth2CredentialsProvider(mockOptions);

        // Advance time to expire the token
        jest.advanceTimersByTime(2000);

        // Second call should fetch new token
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(newTokenResponse),
        });

        const result = await oauth2CredentialsProvider(mockOptions);

        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(result.credentials.token).toBe('fresh-token');
      });

      it('should apply safety margin to token expiration', async () => {
        const mockTokenResponse = {
          access_token: 'safety-margin-token',
          token_type: 'Bearer',
          expires_in: 600, // 10 minutes
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse),
        });

        await oauth2CredentialsProvider(mockOptions);

        // 600s lifetime - 60s safety margin (10%) = 540s cached. Advance to 8 minutes,
        // comfortably inside that window rather than sitting on the boundary.
        jest.advanceTimersByTime(8 * 60 * 1000);

        mockFetch.mockClear();
        const result = await oauth2CredentialsProvider(mockOptions);

        expect(mockFetch).not.toHaveBeenCalled();
        expect(result.credentials.token).toBe('safety-margin-token');

        // Advance past the 540s mark - the entry should now be treated as expired even
        // though the IdP's nominal 600s lifetime has not elapsed.
        jest.advanceTimersByTime(2 * 60 * 1000);

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              access_token: 'refreshed-token',
              token_type: 'Bearer',
              expires_in: 3600,
            }),
        });

        const refreshedResult = await oauth2CredentialsProvider(mockOptions);
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(refreshedResult.credentials.token).toBe('refreshed-token');
      });
    });
  });

  describe('Retry Classification', () => {
    it('should retry on server errors (5xx)', async () => {
      const mockTokenResponse = {
        access_token: 'retry-success-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      // First two attempts fail with 500, third succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: () => Promise.resolve('Server error'),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
          text: () => Promise.resolve('Service unavailable'),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse),
        });

      const result = await oauth2CredentialsProvider(mockOptions);

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result.credentials.token).toBe('retry-success-token');
    });

    it('should retry on retryable client errors (408, 429)', async () => {
      const mockTokenResponse = {
        access_token: 'retry-client-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      // First attempt fails with 429, second succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          text: () => Promise.resolve('Rate limited'),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse),
        });

      const result = await oauth2CredentialsProvider(mockOptions);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.credentials.token).toBe('retry-client-token');
    });

    it('should NOT retry on non-retryable client errors (400, 401, 403)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: () => Promise.resolve('Invalid credentials'),
      });

      await expect(oauth2CredentialsProvider(mockOptions)).rejects.toThrow(
        'Failed to obtain OAuth2 token after 3 attempts'
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should apply exponential backoff between retries', async () => {
      const mockTokenResponse = {
        access_token: 'backoff-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      // First two attempts fail, third succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: () => Promise.resolve('Server error'),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: () => Promise.resolve('Server error'),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse),
        });

      const result = await oauth2CredentialsProvider(mockOptions);

      // Verify exponential backoff delays were applied
      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 1000); // 1s
      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 2000); // 2s

      expect(result.credentials.token).toBe('backoff-token');
    });
  });

  describe('Concurrent Refresh Deduplication', () => {
    it('should handle concurrent requests for same configuration', async () => {
      const mockTokenResponse = {
        access_token: 'concurrent-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      let resolveFirstFetch: (value: any) => void = () => {};
      const firstFetchPromise = new Promise((resolve) => {
        resolveFirstFetch = resolve;
      });

      // First fetch will be delayed
      mockFetch.mockImplementationOnce(() => firstFetchPromise);

      // Start two concurrent requests
      const promise1 = oauth2CredentialsProvider(mockOptions);
      const promise2 = oauth2CredentialsProvider(mockOptions);

      // Resolve the first fetch
      resolveFirstFetch({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse),
      });

      const [result1, result2] = await Promise.all([promise1, promise2]);

      // Both should get the same token, but only one fetch should have occurred
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result1.credentials.token).toBe('concurrent-token');
      expect(result2.credentials.token).toBe('concurrent-token');
    });

    it("should serve the winner's token to a request that queued behind it", async () => {
      // The loser of the race runs its loader only after the winner has already populated the
      // cache. Without the re-check inside the loader it would fetch a second token, which is
      // exactly the IdP rate-limit problem the deduplication exists to prevent.
      const firstResponse = {
        access_token: 'winner-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      let releaseFirstFetch: (value: any) => void = () => {};
      const gate = new Promise((resolve) => {
        releaseFirstFetch = resolve;
      });

      mockFetch.mockImplementationOnce(() => gate);

      const winner = oauth2CredentialsProvider(mockOptions);
      const loser = oauth2CredentialsProvider(mockOptions);

      releaseFirstFetch({
        ok: true,
        json: () => Promise.resolve(firstResponse),
      });

      const [winnerResult, loserResult] = await Promise.all([winner, loser]);

      expect(winnerResult.credentials.token).toBe('winner-token');
      expect(loserResult.credentials.token).toBe('winner-token');
      // A third request afterwards is a plain cache hit, still no second token.
      const later = await oauth2CredentialsProvider(mockOptions);
      expect(later.credentials.token).toBe('winner-token');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Audience handling', () => {
    it('should handle a JSON-encoded array audience', async () => {
      const dataSourceWithArrayAudience = {
        ...baseDataSourceAttr,
        auth: {
          ...baseDataSourceAttr.auth,
          credentials: {
            ...baseDataSourceAttr.auth.credentials,
            audience: '["https://api1.example.com", "https://api2.example.com"]',
          },
        },
      };

      const mockTokenResponse = {
        access_token: 'array-audience-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse),
      });

      const result = await oauth2CredentialsProvider({
        ...mockOptions,
        dataSourceAttr: dataSourceWithArrayAudience,
      });

      expect(result.credentials.token).toBe('array-audience-token');

      // Verify that the request body contains multiple audience parameters
      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = fetchCall[1].body;
      expect(requestBody).toContain('audience=https%3A%2F%2Fapi1.example.com');
      expect(requestBody).toContain('audience=https%3A%2F%2Fapi2.example.com');
    });

    it('should handle audience already stored as an array', async () => {
      // The saved object may hold a real array rather than the JSON-encoded string, depending on
      // how the data source was created.
      const dataSourceWithRealArray = {
        ...baseDataSourceAttr,
        auth: {
          ...baseDataSourceAttr.auth,
          credentials: {
            ...baseDataSourceAttr.auth.credentials,
            audience: ['https://api1.example.com', '  ', 'https://api2.example.com'],
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'real-array-audience-token',
            token_type: 'Bearer',
            expires_in: 3600,
          }),
      });

      const result = await oauth2CredentialsProvider({
        ...mockOptions,
        dataSourceAttr: dataSourceWithRealArray,
      });

      expect(result.credentials.token).toBe('real-array-audience-token');

      const requestBody = mockFetch.mock.calls[0][1].body;
      expect(requestBody).toContain('audience=https%3A%2F%2Fapi1.example.com');
      expect(requestBody).toContain('audience=https%3A%2F%2Fapi2.example.com');
      // The blank entry is dropped rather than sent as an empty audience.
      expect(requestBody).not.toContain('audience=&');
      expect(requestBody.endsWith('audience=')).toBe(false);
    });
  });

  describe('Token Cleanup Functionality', () => {
    it('should initialize token cleanup interval', () => {
      tokenCache.initialize();

      expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 5 * 60 * 1000);
    });

    it('should not initialize cleanup interval if already initialized', () => {
      tokenCache.initialize();
      jest.clearAllMocks();

      tokenCache.initialize();

      expect(mockSetInterval).not.toHaveBeenCalled();
    });

    it('should clean up expired tokens during cleanup cycle', async () => {
      const shortLivedTokenResponse = {
        access_token: 'short-lived-token',
        token_type: 'Bearer',
        expires_in: 1,
      };

      const longLivedTokenResponse = {
        access_token: 'long-lived-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      // Create two tokens with different lifespans
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(shortLivedTokenResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(longLivedTokenResponse),
        });

      // Get first token (short-lived)
      await oauth2CredentialsProvider(mockOptions);

      // Get second token with different config (long-lived)
      const differentOptions = {
        ...mockOptions,
        dataSourceAttr: {
          ...baseDataSourceAttr,
          auth: {
            ...baseDataSourceAttr.auth,
            credentials: {
              ...baseDataSourceAttr.auth.credentials,
              clientId: 'different-client',
            },
          },
        },
      };
      await oauth2CredentialsProvider(differentOptions);

      // Initialize cleanup
      tokenCache.initialize();

      // Advance time to expire the short-lived token
      jest.advanceTimersByTime(2000);

      // Trigger cleanup cycle
      jest.advanceTimersByTime(5 * 60 * 1000);

      // The short-lived token should be cleaned up, long-lived should remain
      mockFetch.mockClear();

      // This should fetch a new token (cache miss)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'new-token', expires_in: 3600 }),
      });
      await oauth2CredentialsProvider(mockOptions);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // This should use cached token (cache hit)
      mockFetch.mockClear();
      await oauth2CredentialsProvider(differentOptions);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should dispose of cleanup interval', () => {
      tokenCache.initialize();
      tokenCache.dispose();

      expect(mockClearInterval).toHaveBeenCalled();
    });

    it('should clear specific cached token', async () => {
      const mockTokenResponse = {
        access_token: 'to-be-cleared-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse),
      });

      // Get token to populate cache
      const result = await oauth2CredentialsProvider(mockOptions);
      const cacheKey = result.cacheKeySuffix.replace('oauth2:', '');

      // Clear the specific token
      tokenCache.clearToken(cacheKey);

      // Next call should fetch new token
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'new-token', expires_in: 3600 }),
      });

      await oauth2CredentialsProvider(mockOptions);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing OAuth2 configuration', async () => {
      const invalidOptions = {
        ...mockOptions,
        dataSourceAttr: {
          title: 'Invalid Data Source',
          endpoint: 'https://test.com',
          dataSourceVersion: '1.0.0',
          auth: {
            type: 'no_auth',
            credentials: undefined,
          },
        },
      };

      await expect(oauth2CredentialsProvider(invalidOptions)).rejects.toThrow(
        'OAuth2 credentials provider requires OAuth2 configuration'
      );
    });

    it('should handle incomplete OAuth2 credentials', async () => {
      const incompleteOptions = {
        ...mockOptions,
        dataSourceAttr: {
          ...baseDataSourceAttr,
          auth: {
            type: AuthType.OAuth2,
            credentials: {
              clientId: 'test-client-id',
              // Missing clientSecret and tokenUrl
            },
          },
        },
      };

      await expect(oauth2CredentialsProvider(incompleteOptions)).rejects.toThrow(
        'OAuth2 credentials are incomplete'
      );
    });

    it('should handle token response without access_token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            token_type: 'Bearer',
            expires_in: 3600,
            // Missing access_token
          }),
      });

      await expect(oauth2CredentialsProvider(mockOptions)).rejects.toThrow(
        'OAuth2 token response does not contain access_token'
      );
    });

    it('should handle cryptography service decryption', async () => {
      const encryptedSecret = 'encrypted-secret-data';
      const decryptedSecret = 'decrypted-secret';

      mockCryptography.decodeAndDecrypt.mockResolvedValueOnce({
        decryptedText: decryptedSecret,
        encryptionContext: {
          endpoint: baseDataSourceAttr.endpoint,
        },
      });

      const optionsWithEncryption = {
        ...mockOptions,
        dataSourceAttr: {
          ...baseDataSourceAttr,
          auth: {
            ...baseDataSourceAttr.auth,
            credentials: {
              ...baseDataSourceAttr.auth.credentials,
              clientSecret: encryptedSecret,
            },
          },
        },
      };

      const mockTokenResponse = {
        access_token: 'decrypted-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse),
      });

      const result = await oauth2CredentialsProvider(optionsWithEncryption);

      expect(mockCryptography.decodeAndDecrypt).toHaveBeenCalledWith(encryptedSecret);
      expect(result.credentials.token).toBe('decrypted-token');
    });

    it('should handle endpoint contamination security check', async () => {
      mockCryptography.decodeAndDecrypt.mockResolvedValueOnce({
        decryptedText: 'decrypted-secret',
        encryptionContext: {
          endpoint: 'https://different-endpoint.com', // Different from dataSourceAttr.endpoint
        },
      });

      await expect(oauth2CredentialsProvider(mockOptions)).rejects.toThrow(
        'Data source "endpoint" contaminated'
      );
    });

    it('should throw error on decryption failures instead of falling back', async () => {
      mockCryptography.decodeAndDecrypt.mockRejectedValueOnce(new Error('Decryption failed'));

      // Should throw an error instead of falling back to raw client secret
      await expect(oauth2CredentialsProvider(mockOptions)).rejects.toThrow(
        'Failed to decrypt client secret: Decryption failed'
      );
    });

    it('should clear cache on token fetch failure', async () => {
      const mockTokenResponse = {
        access_token: 'initial-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      // First call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse),
      });

      await oauth2CredentialsProvider(mockOptions);

      // Manually expire the token
      jest.advanceTimersByTime(4000 * 1000);

      // Second call fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('Server error'),
      });

      await expect(oauth2CredentialsProvider(mockOptions)).rejects.toThrow(
        'Failed to obtain OAuth2 token after 3 attempts'
      );

      // Third call should fetch fresh token (cache was cleared)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'fresh-after-failure-token',
            expires_in: 3600,
          }),
      });

      const result = await oauth2CredentialsProvider(mockOptions);
      expect(result.credentials.token).toBe('fresh-after-failure-token');
    });

    it('should handle network errors during token fetch', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(oauth2CredentialsProvider(mockOptions)).rejects.toThrow(
        'Failed to obtain OAuth2 token after 3 attempts'
      );
    });

    it('should use default values for missing token response fields', async () => {
      const mockTokenResponse = {
        access_token: 'minimal-response-token',
        token_type: 'Bearer',
        // Missing expires_in
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse),
      });

      const result = await oauth2CredentialsProvider(mockOptions);
      expect(result.credentials.token).toBe('minimal-response-token');
    });
  });

  describe('requireDecryption', () => {
    it('skips decryption when requireDecryption is false', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'plaintext-secret-token',
            token_type: 'Bearer',
            expires_in: 3600,
          }),
      });

      // Test connection on a data source that has not been saved yet supplies plain text
      // credentials. Decrypting them would always fail, so the provider must not try.
      const result = await oauth2CredentialsProvider({
        ...mockOptions,
        requireDecryption: false,
      });

      expect(mockCryptography.decodeAndDecrypt).not.toHaveBeenCalled();
      expect(result.credentials.token).toBe('plaintext-secret-token');

      const sentAuth = mockFetch.mock.calls[0][1].headers.Authorization;
      const decoded = Buffer.from(sentAuth.replace('Basic ', ''), 'base64').toString('utf8');
      // The plain text secret is used as-is rather than the decrypted stub value.
      expect(decoded).toBe('test-client-id:test-client-secret');
    });

    it('decrypts when requireDecryption is omitted', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'decrypted-token',
            token_type: 'Bearer',
            expires_in: 3600,
          }),
      });

      await oauth2CredentialsProvider(mockOptions);

      // Callers that do not pass the flag keep the previous behaviour.
      expect(mockCryptography.decodeAndDecrypt).toHaveBeenCalledTimes(1);
    });
  });
});
