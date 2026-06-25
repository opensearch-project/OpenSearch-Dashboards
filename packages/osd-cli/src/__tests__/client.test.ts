/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as http from 'http';
import { OsdClient, ClientError } from '../client';
import { ProfileConfig } from '../config';

/**
 * Creates a local HTTP server for testing the client.
 */
function createMockServer(
  handler: (req: http.IncomingMessage, res: http.ServerResponse) => void
): Promise<{ server: http.Server; port: number }> {
  return new Promise((resolve) => {
    const server = http.createServer(handler);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as { port: number };
      resolve({ server, port: addr.port });
    });
  });
}

function closeServer(server: http.Server): Promise<void> {
  return new Promise((resolve) => server.close(() => resolve()));
}

describe('OsdClient', () => {
  let mockServer: http.Server;
  let port: number;
  let lastRequest: {
    method: string;
    url: string;
    headers: http.IncomingHttpHeaders;
    body: string;
  };
  let responseStatus: number;
  let responseBody: unknown;

  beforeEach(async () => {
    lastRequest = { method: '', url: '', headers: {}, body: '' };
    responseStatus = 200;
    responseBody = {};

    const mock = await createMockServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', () => {
        lastRequest = {
          method: req.method || '',
          url: req.url || '',
          headers: req.headers,
          body: Buffer.concat(chunks).toString('utf-8'),
        };
        res.writeHead(responseStatus, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(responseBody));
      });
    });

    mockServer = mock.server;
    port = mock.port;
  });

  afterEach(async () => {
    await closeServer(mockServer);
  });

  function createClient(overrides?: Partial<ProfileConfig>): OsdClient {
    return new OsdClient({
      url: `http://127.0.0.1:${port}`,
      ...overrides,
    });
  }

  describe('validate', () => {
    it('should call POST /api/saved_objects/_validate with correct body', async () => {
      responseBody = [{ valid: true }];

      const client = createClient();
      const objects = [{ type: 'dashboard', id: 'test-1', attributes: { title: 'Test' } }];
      const results = await client.validate(objects);

      expect(lastRequest.method).toBe('POST');
      expect(lastRequest.url).toBe('/api/saved_objects/_validate');
      expect(JSON.parse(lastRequest.body)).toEqual({ objects });
      expect(results).toEqual([{ valid: true }]);
    });
  });

  describe('diff', () => {
    it('should call POST /api/saved_objects/_diff with correct body', async () => {
      responseBody = [{ status: 'NEW', type: 'dashboard', id: 'test-1' }];

      const client = createClient();
      const objects = [{ type: 'dashboard', id: 'test-1', attributes: { title: 'Test' } }];
      const results = await client.diff(objects);

      expect(lastRequest.method).toBe('POST');
      expect(lastRequest.url).toBe('/api/saved_objects/_diff');
      expect(JSON.parse(lastRequest.body)).toEqual({ objects });
      expect(results[0].status).toBe('NEW');
    });
  });

  describe('bulkApply', () => {
    it('should call POST /api/saved_objects/_bulk_apply with correct body', async () => {
      responseBody = [{ status: 'CREATED', type: 'dashboard', id: 'test-1', version: 1 }];

      const client = createClient();
      const objects = [{ type: 'dashboard', id: 'test-1', attributes: { title: 'Test' } }];
      const results = await client.bulkApply(objects);

      expect(lastRequest.method).toBe('POST');
      expect(lastRequest.url).toBe('/api/saved_objects/_bulk_apply');
      const body = JSON.parse(lastRequest.body);
      expect(body.objects).toEqual(objects);
      expect(body.dryRun).toBe(false);
      expect(results[0].status).toBe('CREATED');
    });

    it('should send dryRun flag when specified', async () => {
      responseBody = [{ status: 'CREATED', type: 'dashboard', id: 'test-1', version: 1 }];

      const client = createClient();
      const objects = [{ type: 'dashboard', id: 'test-1', attributes: { title: 'Test' } }];
      await client.bulkApply(objects, { dryRun: true });

      const body = JSON.parse(lastRequest.body);
      expect(body.dryRun).toBe(true);
    });
  });

  describe('authentication', () => {
    it('should set Bearer token auth header', async () => {
      responseBody = {};

      const client = createClient({ token: 'my-token-123' });
      await client.getSchemas();

      expect(lastRequest.headers['authorization']).toBe('Bearer my-token-123');
    });

    it('should set Basic auth header from username and password', async () => {
      responseBody = {};

      const client = createClient({ username: 'admin', password: 'secret' });
      await client.getSchemas();

      const expected = 'Basic ' + Buffer.from('admin:secret').toString('base64');
      expect(lastRequest.headers['authorization']).toBe(expected);
    });

    it('should prefer token auth when both token and username are set', async () => {
      responseBody = {};

      const client = createClient({ token: 'tok', username: 'user', password: 'pass' });
      await client.getSchemas();

      expect(lastRequest.headers['authorization']).toBe('Bearer tok');
    });

    it('should send osd-xsrf header', async () => {
      responseBody = {};

      const client = createClient();
      await client.getSchemas();

      expect(lastRequest.headers['osd-xsrf']).toBe('true');
    });
  });

  describe('error handling', () => {
    it('should throw ClientError on 401', async () => {
      responseStatus = 401;
      responseBody = { message: 'Unauthorized' };

      const client = createClient();
      await expect(client.getSchemas()).rejects.toThrow(ClientError);
      await expect(client.getSchemas()).rejects.toThrow('Authentication failed');
    });

    it('should throw ClientError on 404', async () => {
      responseStatus = 404;
      responseBody = { message: 'Not found' };

      const client = createClient();
      await expect(client.getSchemas()).rejects.toThrow('not found');
    });

    it('should throw ClientError on 500', async () => {
      responseStatus = 500;
      responseBody = { error: 'Internal server error' };

      const client = createClient();
      await expect(client.getSchemas()).rejects.toThrow('Server error (500)');
    });

    it('should include statusCode on ClientError', async () => {
      responseStatus = 403;
      responseBody = {};

      const client = createClient();
      try {
        await client.getSchemas();
        fail('Expected error');
      } catch (err) {
        expect(err).toBeInstanceOf(ClientError);
        expect((err as ClientError).statusCode).toBe(403);
      }
    });

    it('should throw on network error', async () => {
      // Connect to a port that's not listening
      const client = new OsdClient({ url: 'http://127.0.0.1:1' });
      await expect(client.getSchemas()).rejects.toThrow('Network error');
    });
  });

  describe('get', () => {
    it('should call GET /api/saved_objects/:type/:id', async () => {
      responseBody = { type: 'dashboard', id: 'abc', attributes: {} };

      const client = createClient();
      const result = await client.get('dashboard', 'abc');

      expect(lastRequest.method).toBe('GET');
      expect(lastRequest.url).toBe('/api/saved_objects/dashboard/abc');
      expect(result.type).toBe('dashboard');
    });
  });

  describe('find', () => {
    it('should call GET /api/saved_objects/_find with query params', async () => {
      responseBody = { saved_objects: [], total: 0 };

      const client = createClient();
      await client.find({ type: 'dashboard', search: 'test', perPage: 10, page: 1 });

      expect(lastRequest.method).toBe('GET');
      expect(lastRequest.url).toContain('/api/saved_objects/_find');
      expect(lastRequest.url).toContain('type=dashboard');
      expect(lastRequest.url).toContain('search=test');
      expect(lastRequest.url).toContain('per_page=10');
      expect(lastRequest.url).toContain('page=1');
    });
  });

  describe('exportClean', () => {
    it('should call POST /api/saved_objects/_export_clean', async () => {
      responseBody = [{ type: 'dashboard', id: 'test', attributes: {} }];

      const client = createClient();
      const result = await client.exportClean({ labels: { team: 'my-team' } });

      expect(lastRequest.method).toBe('POST');
      expect(lastRequest.url).toBe('/api/saved_objects/_export_clean');
      const body = JSON.parse(lastRequest.body);
      expect(body.labels).toEqual({ team: 'my-team' });
      expect(result).toHaveLength(1);
    });
  });
});
