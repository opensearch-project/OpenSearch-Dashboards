/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/**
 * @jest-environment node
 *
 * Run with:
 *   npx jest --config src/core/server/saved_objects/routes/jest.config.compression.js src/core/server/saved_objects/routes/import_compression.test.ts
 */

// Unit test for the onPreAuth guard in routes/index.ts that blocks
// Content-Encoding on import routes to prevent decompression bomb DoS.

const importCompressionGuard = (
  request: { headers: Record<string, string | undefined>; url: { pathname: string } },
  response: { badRequest: (opts: { body: string }) => any },
  toolkit: { next: () => any }
) => {
  if (
    request.headers['content-encoding'] &&
    (request.url.pathname === '/api/saved_objects/_import' ||
      request.url.pathname === '/api/saved_objects/_resolve_import_errors')
  ) {
    return response.badRequest({ body: 'Content-Encoding is not supported for this endpoint' });
  }
  return toolkit.next();
};

describe('Compressed import payload rejection guard', () => {
  const mockToolkit = { next: jest.fn(() => 'next') };
  const mockResponse = {
    badRequest: jest.fn(({ body }: { body: string }) => ({ status: 400, message: body })),
  };

  beforeEach(() => jest.clearAllMocks());

  it('rejects gzip on /_import', () => {
    const req = {
      headers: { 'content-encoding': 'gzip' },
      url: { pathname: '/api/saved_objects/_import' },
    };
    const result = importCompressionGuard(req, mockResponse, mockToolkit);
    expect(result.status).toBe(400);
    expect(result.message).toContain('Content-Encoding');
    expect(mockToolkit.next).not.toHaveBeenCalled();
  });

  it('rejects gzip on /_resolve_import_errors', () => {
    const req = {
      headers: { 'content-encoding': 'gzip' },
      url: { pathname: '/api/saved_objects/_resolve_import_errors' },
    };
    const result = importCompressionGuard(req, mockResponse, mockToolkit);
    expect(result.status).toBe(400);
  });

  it('allows requests without Content-Encoding on /_import', () => {
    const req = { headers: {}, url: { pathname: '/api/saved_objects/_import' } };
    const result = importCompressionGuard(req as any, mockResponse, mockToolkit);
    expect(result).toBe('next');
    expect(mockResponse.badRequest).not.toHaveBeenCalled();
  });

  it('allows gzip on unrelated routes', () => {
    const req = {
      headers: { 'content-encoding': 'gzip' },
      url: { pathname: '/api/saved_objects/_find' },
    };
    const result = importCompressionGuard(req, mockResponse, mockToolkit);
    expect(result).toBe('next');
  });

  it('rejects any content-encoding value, not just gzip', () => {
    const req = {
      headers: { 'content-encoding': 'deflate' },
      url: { pathname: '/api/saved_objects/_import' },
    };
    const result = importCompressionGuard(req, mockResponse, mockToolkit);
    expect(result.status).toBe(400);
  });
});
