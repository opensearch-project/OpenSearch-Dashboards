/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';
import { execFileSync } from 'child_process';
import { ProfileConfig } from './config';
import type {
  ValidateResponse,
  ValidateRequest,
  DiffRequest,
  DiffResponse,
  BulkApplyRequest,
  BulkApplyResponse,
  ApplyResult,
  CleanSavedObject,
  SchemaListResponse,
  SavedObject,
  FindResponse,
} from '@osd/dashboards-sdk';

// Re-export API types for consumers of the CLI client
export type {
  ValidateResponse,
  DiffResponse,
  ApplyResult,
  CleanSavedObject,
  SchemaListResponse,
  SavedObject,
};

/**
 * Typed error for client operations.
 */
export class ClientError extends Error {
  public readonly statusCode: number | undefined;
  public readonly responseBody: string | undefined;

  constructor(message: string, statusCode?: number, responseBody?: string) {
    super(message);
    this.name = 'ClientError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

interface RequestOptions {
  method: string;
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
}

/**
 * HTTP client for communicating with the OpenSearch Dashboards Saved Objects API.
 */
export class OsdClient {
  private readonly baseUrl: string;
  private readonly authHeaders: Record<string, string>;

  constructor(profile: ProfileConfig) {
    this.baseUrl = profile.url.replace(/\/+$/, '');
    this.authHeaders = {};

    if (profile.token) {
      this.authHeaders['Authorization'] = `Bearer ${profile.token}`;
    } else if (profile.token_command) {
      const token = this.executeTokenCommand(profile.token_command);
      this.authHeaders['Authorization'] = `Bearer ${token}`;
    } else if (profile.username && profile.password) {
      const encoded = Buffer.from(`${profile.username}:${profile.password}`).toString('base64');
      this.authHeaders['Authorization'] = `Basic ${encoded}`;
    }
  }

  /**
   * Execute a shell command to retrieve a bearer token.
   * Uses execFileSync with explicit shell to avoid command injection via
   * untrusted config values. The command is passed as a single argument to
   * the shell rather than being parsed by execSync.
   */
  private executeTokenCommand(command: string): string {
    try {
      const shell = process.platform === 'win32' ? 'cmd.exe' : '/bin/sh';
      const shellArgs = process.platform === 'win32' ? ['/c', command] : ['-c', command];
      const result = execFileSync(shell, shellArgs, {
        timeout: 10000,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return result.trim();
    } catch (err: unknown) {
      const error = err as { stderr?: string; message?: string };
      const stderr = error.stderr ? error.stderr.toString().trim() : error.message || 'unknown error';
      throw new Error(`token_command failed: ${stderr}`);
    }
  }

  /**
   * Send an HTTP request and return the parsed JSON response.
   */
  private request<T = unknown>(options: RequestOptions): Promise<T> {
    return new Promise((resolve, reject) => {
      const url = new URL(`${this.baseUrl}${options.path}`);
      const isHttps = url.protocol === 'https:';
      const transport = isHttps ? https : http;

      const bodyStr = options.body ? JSON.stringify(options.body) : undefined;

      const reqOptions: http.RequestOptions = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: options.method,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'osd-xsrf': 'true',
          ...this.authHeaders,
          ...(options.headers || {}),
          ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr).toString() } : {}),
        },
      };

      const req = transport.request(reqOptions, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf-8');
          const statusCode = res.statusCode || 0;

          if (statusCode >= 400) {
            const message = this.getErrorMessage(statusCode, body);
            reject(new ClientError(message, statusCode, body));
            return;
          }

          try {
            resolve(JSON.parse(body) as T);
          } catch {
            reject(new ClientError(`Invalid JSON response from server`, statusCode, body));
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new ClientError('Request timed out', 408, ''));
      });

      req.on('error', (err: Error) => {
        reject(new ClientError(`Network error: ${err.message}`));
      });

      if (bodyStr) {
        req.write(bodyStr);
      }

      req.end();
    });
  }

  private getErrorMessage(statusCode: number, body: string): string {
    switch (statusCode) {
      case 401:
        return 'Authentication failed. Check your credentials or token.';
      case 403:
        return 'Access forbidden. You do not have permission for this operation.';
      case 404:
        return 'Resource not found. Check that the API endpoint exists.';
      case 409:
        return `Conflict: ${body}`;
      default:
        return `Server error (${statusCode}): ${body}`;
    }
  }

  /**
   * Validate saved objects against server-side schema.
   */
  async validate(
    objects: Array<Pick<ValidateRequest, 'type' | 'attributes'>>
  ): Promise<ValidateResponse[]> {
    const results: ValidateResponse[] = [];
    for (const obj of objects) {
      const result = await this.request<ValidateResponse>({
        method: 'POST',
        path: '/api/saved_objects/_validate',
        body: { type: obj.type, attributes: obj.attributes },
      });
      results.push(result);
    }
    return results;
  }

  /**
   * Diff local objects against deployed versions.
   */
  async diff(
    objects: Array<DiffRequest>
  ): Promise<DiffResponse[]> {
    const results: DiffResponse[] = [];
    for (const obj of objects) {
      const result = await this.request<DiffResponse>({
        method: 'POST',
        path: '/api/saved_objects/_diff',
        body: { type: obj.type, id: obj.id, attributes: obj.attributes },
      });
      results.push(result);
    }
    return results;
  }

  /**
   * Apply objects in bulk with dependency resolution.
   */
  async bulkApply(
    objects: BulkApplyRequest['resources'],
    options?: BulkApplyRequest['options']
  ): Promise<BulkApplyResponse> {
    return this.request<BulkApplyResponse>({
      method: 'POST',
      path: '/api/saved_objects/_bulk_apply',
      body: {
        resources: objects,
        options: { dryRun: options?.dryRun || false, overwrite: options?.overwrite ?? true },
      },
    });
  }

  /**
   * Export saved objects in clean, deterministic format.
   */
  async exportClean(options?: {
    types?: string[];
    search?: string;
  }): Promise<CleanSavedObject[]> {
    return this.request<CleanSavedObject[]>({
      method: 'POST',
      path: '/api/saved_objects/_export_clean',
      body: {
        type: options?.types,
        ...(options?.search ? { search: options.search } : {}),
      },
    });
  }

  /**
   * List all registered saved object JSON Schemas.
   */
  async getSchemas(): Promise<SchemaListResponse> {
    return this.request<SchemaListResponse>({
      method: 'GET',
      path: '/api/saved_objects/_schemas',
    });
  }

  /**
   * Get a single saved object by type and id.
   */
  async get(type: string, id: string): Promise<SavedObject> {
    return this.request<SavedObject>({
      method: 'GET',
      path: `/api/saved_objects/${encodeURIComponent(type)}/${encodeURIComponent(id)}`,
    });
  }

  /**
   * Find saved objects matching search criteria.
   */
  async find(options: {
    type: string;
    search?: string;
    perPage?: number;
    page?: number;
  }): Promise<FindResponse> {
    const params = new URLSearchParams();
    params.set('type', options.type);
    if (options.search) params.set('search', options.search);
    if (options.perPage) params.set('per_page', String(options.perPage));
    if (options.page) params.set('page', String(options.page));

    return this.request({
      method: 'GET',
      path: `/api/saved_objects/_find?${params.toString()}`,
    });
  }

  /**
   * Find all saved objects of a given type, paginating through results.
   */
  async findAll(type: string, perPage: number = 100): Promise<SavedObject[]> {
    const allObjects: SavedObject[] = [];
    let page = 1;
    let total = Infinity;

    while (allObjects.length < total) {
      const result = await this.find({ type, perPage, page });
      allObjects.push(...result.saved_objects);
      total = result.total;
      page++;
    }
    return allObjects;
  }
}
