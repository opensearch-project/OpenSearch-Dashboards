/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';
import { ProfileConfig } from './config';

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

/**
 * Validation result from the server.
 */
export interface ValidationResult {
  valid: boolean;
  errors?: Array<{ path: string; message: string }>;
}

/**
 * Diff result from the server.
 */
export interface DiffResult {
  status: 'NEW' | 'UPDATED' | 'UNCHANGED';
  diff?: string;
  type: string;
  id: string;
}

/**
 * Apply result from the server.
 */
export interface ApplyResult {
  status: 'CREATED' | 'UPDATED' | 'UNCHANGED' | 'ERROR';
  type: string;
  id: string;
  version?: number;
  error?: string;
}

/**
 * Saved object representation.
 */
export interface SavedObject {
  type: string;
  id: string;
  attributes: Record<string, unknown>;
  references?: Array<{ type: string; id: string; name: string }>;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  [key: string]: unknown;
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
    } else if (profile.username && profile.password) {
      const encoded = Buffer.from(`${profile.username}:${profile.password}`).toString('base64');
      this.authHeaders['Authorization'] = `Basic ${encoded}`;
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
            resolve(body as unknown as T);
          }
        });
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
  async validate(objects: SavedObject[]): Promise<ValidationResult[]> {
    return this.request<ValidationResult[]>({
      method: 'POST',
      path: '/api/saved_objects/_validate',
      body: { objects },
    });
  }

  /**
   * Diff local objects against deployed versions.
   */
  async diff(objects: SavedObject[]): Promise<DiffResult[]> {
    return this.request<DiffResult[]>({
      method: 'POST',
      path: '/api/saved_objects/_diff',
      body: { objects },
    });
  }

  /**
   * Apply objects in bulk.
   */
  async bulkApply(
    objects: SavedObject[],
    options?: { dryRun?: boolean }
  ): Promise<ApplyResult[]> {
    return this.request<ApplyResult[]>({
      method: 'POST',
      path: '/api/saved_objects/_bulk_apply',
      body: {
        objects,
        dryRun: options?.dryRun || false,
      },
    });
  }

  /**
   * Export saved objects in a clean format.
   */
  async exportClean(options?: {
    types?: string[];
    labels?: Record<string, string>;
  }): Promise<SavedObject[]> {
    return this.request<SavedObject[]>({
      method: 'POST',
      path: '/api/saved_objects/_export_clean',
      body: {
        types: options?.types,
        labels: options?.labels,
      },
    });
  }

  /**
   * Get available schemas for saved object types.
   */
  async getSchemas(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>({
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
  }): Promise<{ saved_objects: SavedObject[]; total: number }> {
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
}
