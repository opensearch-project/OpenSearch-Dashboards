/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from 'crypto';
import { AuthType, OAuth2Content } from '../../common/data_sources';
import { DataSourceCredentialsProvider } from '../types';
import { isValidURL } from '../util/endpoint_validator';
import { extractOAuth2Config } from './oauth2_utils';
import { OAuth2TokenCache } from './oauth2_token_cache';
import { EndpointContaminationError } from './endpoint_contamination_error';
import { OAuth2NonRetryableError } from './oauth2_errors';

interface OAuth2TokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  scope?: string;
}

/**
 * Normalises the audience field into the list of values to send as repeated `audience`
 * form parameters.
 *
 * Accepts a real array, a JSON-encoded array (what the Prometheus property store holds,
 * since those properties are flat strings), or a comma-separated list (the format the
 * SQL plugin's OAuth2TokenInterceptor splits on). Handling all three keeps a data source
 * working the same way whether its token is minted here or by the SQL plugin.
 *
 * As on the SQL side, an audience value that itself contains a comma is not supported.
 */
const parseAudiences = (audience: string | string[]): string[] => {
  if (Array.isArray(audience)) {
    return audience.map((aud) => String(aud).trim()).filter(Boolean);
  }

  const trimmed = audience.trim();

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((aud) => String(aud).trim()).filter(Boolean);
      }
    } catch (error) {
      // Not valid JSON after all - fall through and read it as a comma-separated list.
    }
  }

  return trimmed
    .split(',')
    .map((aud) => aud.trim())
    .filter(Boolean);
};

const createOAuth2CredentialsProvider =
  (tokenCache: OAuth2TokenCache): DataSourceCredentialsProvider =>
  async (options) => {
    const {
      dataSourceAttr,
      cryptography,
      endpointDeniedIPs,
      endpointAllowlistedSuffixes,
      requireDecryption,
    } = options;

    // Extract OAuth2 configuration using shared helper
    const oauth2Config = extractOAuth2Config(dataSourceAttr);
    if (!oauth2Config) {
      // extractOAuth2Config only returns a config once clientId, clientSecret and tokenUrl
      // are all present, so a data source that explicitly asks for OAuth2 but is missing
      // one of them gets a message naming the fields. Anything else simply is not an
      // OAuth2 data source.
      if (dataSourceAttr.auth?.type === AuthType.OAuth2) {
        throw new Error(
          'OAuth2 credentials are incomplete. Client ID, Client Secret, and Token URL are required.'
        );
      }
      throw new Error('OAuth2 credentials provider requires OAuth2 configuration');
    }
    const credentials: OAuth2Content = oauth2Config;

    // Create cache key based on all OAuth2 parameters to prevent token sharing between different configurations
    const audienceKey = Array.isArray(credentials.audience)
      ? credentials.audience.join(',')
      : credentials.audience || '';
    const cacheKeyParts = [
      credentials.clientId,
      credentials.tokenUrl,
      credentials.scopes || '',
      audienceKey,
      credentials.grantType || 'client_credentials',
      dataSourceAttr.endpoint,
      // Rotating the client secret must invalidate any token minted with the old one -
      // otherwise a secret revoked because it leaked keeps working until the cached token
      // happens to expire. The stored (encrypted) value is hashed rather than used
      // directly so the key never carries credential material, matching what
      // OAuth2TokenInterceptor.buildCacheKey does on the SQL side. Re-encrypting the same
      // secret produces new ciphertext and so a new key, which only costs one refetch.
      createHash('sha256').update(credentials.clientSecret).digest('hex'),
    ];
    const cacheKey = cacheKeyParts.join(':');

    const buildResult = (token: string) => ({
      authType: AuthType.OAuth2,
      endpoint: dataSourceAttr.endpoint,
      cacheKeySuffix: `oauth2:${cacheKey}`,
      credentials: { ...credentials, token },
    });

    // Check if we have a valid cached token
    const cachedToken = tokenCache.getToken(cacheKey);
    if (cachedToken) {
      return buildResult(cachedToken);
    }

    // Deduplicate concurrent misses: a dashboard renders many panels against the same data
    // source at once, and without this each one would mint its own token. A caller that arrives
    // while a fetch is in progress awaits that promise instead of running this loader, and
    // getOrFetchToken invokes the loader synchronously on a miss, so there is no window in which
    // the cache could have been filled between the lookup above and the fetch below.
    const token = await tokenCache.getOrFetchToken(cacheKey, async () => {
      // Validate token URL to prevent SSRF attacks - same validation as test connection route.
      // Deliberately inside the fetch path rather than before the cache lookup: isValidURL does
      // a dns.lookup for any host not covered by endpointAllowlistedSuffixes, so validating up
      // front made every panel on an OAuth2 data source pay a DNS round trip even when the
      // cached token was going to be used. No token is ever requested without this passing.
      const tokenUrlValidation = await isValidURL(
        credentials.tokenUrl,
        endpointDeniedIPs,
        endpointAllowlistedSuffixes
      );
      if (!tokenUrlValidation.valid) {
        throw new Error(
          `OAuth2 token URL validation failed: ${
            tokenUrlValidation.userMessage || tokenUrlValidation.error
          }`
        );
      }

      // Decrypt credentials if cryptography service is available.
      // requireDecryption is false when the caller already holds plain text credentials - the
      // "Test connection" flow for a data source that has not been saved yet. Decrypting then
      // would always fail. Only an explicit false skips it, so callers that omit the flag keep
      // decrypting as before.
      let clientSecret = credentials.clientSecret;
      if (cryptography && requireDecryption !== false) {
        try {
          const { decryptedText, encryptionContext } = await cryptography.decodeAndDecrypt(
            credentials.clientSecret
          );

          // Validate encryption context - this is a security check that must not be bypassed
          if (encryptionContext?.endpoint !== dataSourceAttr.endpoint) {
            throw new EndpointContaminationError(
              'Data source "endpoint" contaminated. Please delete and create another data source.'
            );
          }

          clientSecret = decryptedText;
        } catch (error) {
          // Re-throw endpoint contamination errors - these are security violations
          if (error instanceof EndpointContaminationError) {
            throw error;
          }
          // For any other decryption failure, throw an error instead of silently falling back
          // This prevents potential security issues from using unencrypted secrets when encryption is expected
          throw new Error(
            `Failed to decrypt client secret: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          );
        }
      }
      // No cryptography service available when cryptography is undefined, using raw client secret

      // Fetch new token using client credentials flow with retry logic
      // Use HTTP Basic Auth for client credentials (like the working Python code)
      const tokenRequestBody = new URLSearchParams({
        grant_type: credentials.grantType || 'client_credentials',
      });

      if (credentials.scopes) {
        tokenRequestBody.append('scope', credentials.scopes);
      }

      // Each audience is sent as its own parameter, per RFC 8693 §2.1.
      if (credentials.audience) {
        parseAudiences(credentials.audience).forEach((aud) => {
          tokenRequestBody.append('audience', aud);
        });
      }

      // Create Basic Auth header with proper form-urlencoded encoding per RFC 6749 §2.3.1
      // Both client_id and client_secret need to be form-urlencoded before joining with : and base64ing
      // RFC 6749 mandates application/x-www-form-urlencoded encoding (spaces as +, not %20)
      // Otherwise any secret containing spaces breaks the header and strict IdPs return confusing 401s
      const formEncode = (s: string) => encodeURIComponent(s).replace(/%20/g, '+');
      const encodedId = formEncode(credentials.clientId);
      const encodedSecret = formEncode(clientSecret);
      const basicAuth = Buffer.from(`${encodedId}:${encodedSecret}`).toString('base64');

      // Retry logic for token requests
      let lastError: Error | null = null;
      const maxRetries = 3;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        // Create AbortController for timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        try {
          const response = await fetch(credentials.tokenUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Accept: 'application/json',
              Authorization: `Basic ${basicAuth}`,
            },
            body: tokenRequestBody.toString(),
            signal: controller.signal,
            // Only the configured token URL passes through isValidURL above, so following a
            // redirect would reach an unvalidated host and defeat the deny list - a token
            // endpoint could bounce the request to link-local or cloud-metadata addresses.
            redirect: 'error',
          });

          if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            const errorMessage = `OAuth2 token request failed: ${response.status} ${response.statusText}. Response: ${errorText}`;

            // Throw non-retryable error for client errors (4xx except 408/429) to avoid hammering IdP with bad credentials
            if (
              response.status >= 400 &&
              response.status < 500 &&
              response.status !== 408 &&
              response.status !== 429
            ) {
              throw new OAuth2NonRetryableError(errorMessage);
            }

            throw new Error(errorMessage);
          }

          const tokenResponse: OAuth2TokenResponse = await response.json();

          if (!tokenResponse.access_token) {
            // A 2xx with a malformed body is the IdP answering successfully with something
            // unusable. Retrying cannot change the outcome, so fail fast.
            throw new OAuth2NonRetryableError(
              'OAuth2 token response does not contain access_token'
            );
          }

          // Honour the lifetime the IdP reported. Clamping this up to a floor would keep
          // serving a token the IdP has already invalidated; refetching early is cheap,
          // handing out a dead bearer token is not.
          const expiresIn =
            tokenResponse.expires_in && tokenResponse.expires_in > 0
              ? tokenResponse.expires_in
              : 3600;
          const safetyMarginSeconds = Math.min(300, Math.floor(expiresIn * 0.1)); // 10% of token lifetime or 5 minutes, whichever is smaller
          const effectiveTtl = Math.max(1, expiresIn - safetyMarginSeconds);
          const expiresAt = Date.now() + effectiveTtl * 1000;

          tokenCache.setToken(cacheKey, tokenResponse.access_token, expiresAt);

          return tokenResponse.access_token;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Unknown error');

          // Don't retry on non-retryable errors (4xx client errors except 408/429)
          const isNonRetryableError = lastError instanceof OAuth2NonRetryableError;

          // If this is not the last attempt and the error is retryable, wait before retrying
          if (attempt < maxRetries && !isNonRetryableError) {
            const backoffDelay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff: 1s, 2s, 4s
            await new Promise((resolve) => setTimeout(resolve, backoffDelay));
          } else if (isNonRetryableError) {
            // Break out of retry loop for non-retryable errors
            break;
          }
        } finally {
          // Cleared only once the body has been read. fetch resolves as soon as the headers
          // arrive, so clearing it any earlier would drop the deadline while response.json()
          // is still streaming - an IdP that stalls the body would hang forever and, because
          // the single-flight entry is still held, every later request for this data source
          // would queue behind it.
          clearTimeout(timeoutId);
        }
      }

      // Clear any cached token on failure to force fresh attempts
      tokenCache.clearToken(cacheKey);

      const errorMessage = `Failed to obtain OAuth2 token after ${maxRetries} attempts: ${
        lastError?.message || 'Unknown error'
      }`;
      throw new Error(errorMessage);
    });

    return buildResult(token);
  };

/**
 * Creates an OAuth2 authentication method with the provided configuration
 * @param tokenCache OAuth2 token cache instance
 * @param endpointDeniedIPs List of denied IP addresses/ranges for SSRF protection
 * @param endpointAllowlistedSuffixes List of allowed hostname suffixes
 * @returns OAuth2 authentication method
 */
export function createOAuth2AuthMethod(
  tokenCache: OAuth2TokenCache,
  endpointDeniedIPs?: string[],
  endpointAllowlistedSuffixes?: string[]
) {
  const oauth2CredentialsProvider = createOAuth2CredentialsProvider(tokenCache);

  const oauth2CredentialsProviderWithConfig: DataSourceCredentialsProvider = async (options) => {
    return oauth2CredentialsProvider({
      ...options,
      endpointDeniedIPs,
      endpointAllowlistedSuffixes,
    });
  };

  return {
    name: AuthType.OAuth2,
    credentialProvider: oauth2CredentialsProviderWithConfig,
  };
}

// Export the factory function for creating OAuth2 credentials provider
export { createOAuth2CredentialsProvider };
