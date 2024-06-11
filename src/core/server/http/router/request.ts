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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { URL } from 'url';
import uuid from 'uuid';
import { Request, RouteOptionsApp, RequestApplicationState } from '@hapi/hapi';
import { Observable, fromEvent, merge } from 'rxjs';
import { shareReplay, first, takeUntil } from 'rxjs/operators';
import { RecursiveReadonly } from '@osd/utility-types';
import { deepFreeze } from '@osd/std';

import { Headers } from './headers';
import { RouteMethod, RouteConfigOptions, validBodyOutput, isSafeMethod } from './route';
import { OpenSearchDashboardsSocket, IOpenSearchDashboardsSocket } from './socket';
import { RouteValidator, RouteValidatorFullConfig } from './validator';

const requestSymbol = Symbol('request');

/**
 * @internal
 */
export interface OpenSearchDashboardsRouteOptions extends RouteOptionsApp {
  xsrfRequired: boolean;
}

/**
 * @internal
 */
export interface OpenSearchDashboardsRequestState extends RequestApplicationState {
  requestId: string;
  requestUuid: string;
}

/**
 * Route options: If 'GET' or 'OPTIONS' method, body options won't be returned.
 * @public
 */
export type OpenSearchDashboardsRequestRouteOptions<Method extends RouteMethod> = Method extends
  | 'get'
  | 'options'
  ? Required<Omit<RouteConfigOptions<Method>, 'body'>>
  : Required<RouteConfigOptions<Method>>;

/**
 * Request specific route information exposed to a handler.
 * @public
 * */
export interface OpenSearchDashboardsRequestRoute<Method extends RouteMethod> {
  path: string;
  method: Method;
  options: OpenSearchDashboardsRequestRouteOptions<Method>;
}

/**
 * Request events.
 * @public
 * */
export interface OpenSearchDashboardsRequestEvents {
  /**
   * Observable that emits once if and when the request has been aborted.
   */
  aborted$: Observable<void>;

  /**
   * Observable that emits once if and when the request has been completely handled.
   *
   * @remarks
   * The request may be considered completed if:
   * - A response has been sent to the client; or
   * - The request was aborted.
   */
  completed$: Observable<void>;
}

/**
 * @deprecated
 * `hapi` request object, supported during migration process only for backward compatibility.
 * @public
 */
export interface LegacyRequest extends Request {} // eslint-disable-line @typescript-eslint/no-empty-interface

/**
 * OpenSearch Dashboards specific abstraction for an incoming request.
 * @public
 */
export class OpenSearchDashboardsRequest<
  Params = unknown,
  Query = unknown,
  Body = unknown,
  Method extends RouteMethod = any
> {
  /**
   * Factory for creating requests. Validates the request before creating an
   * instance of a OpenSearchDashboardsRequest.
   * @internal
   */
  public static from<P, Q, B>(
    req: Request,
    routeSchemas: RouteValidator<P, Q, B> | RouteValidatorFullConfig<P, Q, B> = {},
    withoutSecretHeaders: boolean = true
  ) {
    const routeValidator = RouteValidator.from<P, Q, B>(routeSchemas);
    const requestParts = OpenSearchDashboardsRequest.validate(req, routeValidator);
    return new OpenSearchDashboardsRequest(
      req,
      requestParts.params,
      requestParts.query,
      requestParts.body,
      withoutSecretHeaders
    );
  }

  /**
   * Validates the different parts of a request based on the schemas defined for
   * the route. Builds up the actual params, query and body object that will be
   * received in the route handler.
   * @internal
   */
  private static validate<P, Q, B>(
    req: Request,
    routeValidator: RouteValidator<P, Q, B>
  ): {
    params: P;
    query: Q;
    body: B;
  } {
    const params = routeValidator.getParams(req.params, 'request params');
    const query = routeValidator.getQuery(req.query, 'request query');
    const body = routeValidator.getBody(req.payload, 'request body');

    return { query, params, body };
  }
  /**
   * A identifier to identify this request.
   *
   * @remarks
   * Depending on the user's configuration, this value may be sourced from the
   * incoming request's `X-Opaque-Id` header which is not guaranteed to be unique
   * per request.
   */
  public readonly id: string;
  /**
   * A UUID to identify this request.
   *
   * @remarks
   * This value is NOT sourced from the incoming request's `X-Opaque-Id` header. it
   * is always a UUID uniquely identifying the request.
   */
  public readonly uuid: string;
  /** a WHATWG URL standard object. */
  public readonly url: URL;
  /** matched route details */
  public readonly route: RecursiveReadonly<OpenSearchDashboardsRequestRoute<Method>>;
  /**
   * Readonly copy of incoming request headers.
   * @remarks
   * This property will contain a `filtered` copy of request headers.
   */
  public readonly headers: Headers;
  /**
   * Whether or not the request is a "system request" rather than an application-level request.
   * Can be set on the client using the `HttpFetchOptions#asSystemRequest` option.
   */
  public readonly isSystemRequest: boolean;

  /** {@link IOpenSearchDashboardsSocket} */
  public readonly socket: IOpenSearchDashboardsSocket;
  /** Request events {@link OpenSearchDashboardsRequestEvents} */
  public readonly events: OpenSearchDashboardsRequestEvents;
  public readonly auth: {
    /* true if the request has been successfully authenticated, otherwise false. */
    isAuthenticated: boolean;
  };

  /** @internal */
  protected readonly [requestSymbol]: Request;

  constructor(
    request: Request,
    public readonly params: Params,
    public readonly query: Query,
    public readonly body: Body,
    // @ts-expect-error we will use this flag as soon as http request proxy is supported in the core
    // until that time we have to expose all the headers
    private readonly withoutSecretHeaders: boolean
  ) {
    // The `requestId` and `requestUuid` properties will not be populated for requests that are 'faked' by internal systems that leverage
    // OpenSearchDashboardsRequest in conjunction with scoped Elaticcsearch and SavedObjectsClient in order to pass credentials.
    // In these cases, the ids default to a newly generated UUID.
    this.id = (request.app as OpenSearchDashboardsRequestState | undefined)?.requestId ?? uuid.v4();
    this.uuid =
      (request.app as OpenSearchDashboardsRequestState | undefined)?.requestUuid ?? uuid.v4();

    this.url = request.url;
    this.headers = deepFreeze({ ...request.headers });
    this.isSystemRequest =
      request.headers['osd-system-request'] === 'true' ||
      // Remove support for `osd-system-api` in 8.x. Used only by legacy platform.
      request.headers['osd-system-api'] === 'true';

    // prevent Symbol exposure via Object.getOwnPropertySymbols()
    Object.defineProperty(this, requestSymbol, {
      value: request,
      enumerable: false,
    });

    this.route = deepFreeze(this.getRouteInfo(request));
    this.socket = new OpenSearchDashboardsSocket(request.raw.req.socket);
    this.events = this.getEvents(request);

    this.auth = {
      // missing in fakeRequests, so we cast to false
      isAuthenticated: Boolean(request.auth?.isAuthenticated),
    };
  }

  private getEvents(request: Request): OpenSearchDashboardsRequestEvents {
    const finish$ = fromEvent(request.raw.res, 'finish').pipe(shareReplay(1), first());
    const aborted$ = fromEvent<void>(request.raw.req, 'aborted').pipe(first(), takeUntil(finish$));
    const completed$ = merge<void, void>(finish$, aborted$).pipe(shareReplay(1), first());

    return {
      aborted$,
      completed$,
    } as const;
  }

  private getRouteInfo(request: Request): OpenSearchDashboardsRequestRoute<Method> {
    const method = request.method as Method;
    const { parse, maxBytes, allow, output, timeout: payloadTimeout } =
      request.route.settings.payload || {};

    // net.Socket#timeout isn't documented, yet, and isn't part of the types... https://github.com/nodejs/node/pull/34543
    // the socket is also undefined when using @hapi/shot, or when a "fake request" is used
    const socketTimeout = (request.raw.req.socket as any)?.timeout;
    const options = ({
      authRequired: this.getAuthRequired(request),
      // some places in LP call OpenSearchDashboardsRequest.from(request) manually. remove fallback to true before v8
      xsrfRequired:
        (request.route.settings.app as OpenSearchDashboardsRouteOptions)?.xsrfRequired ?? true,
      tags: request.route.settings.tags || [],
      timeout: {
        payload: payloadTimeout,
        idleSocket: socketTimeout === 0 ? undefined : socketTimeout,
      },
      body: isSafeMethod(method)
        ? undefined
        : {
            parse,
            maxBytes,
            accepts: allow,
            output: output as typeof validBodyOutput[number], // We do not support all the HAPI-supported outputs and TS complains
          },
    } as unknown) as OpenSearchDashboardsRequestRouteOptions<Method>; // TS does not understand this is OK so I'm enforced to do this enforced casting

    return {
      path: request.path,
      method,
      options,
    };
  }

  private getAuthRequired(request: Request): boolean | 'optional' {
    const authOptions = request.route.settings.auth;
    if (typeof authOptions === 'object') {
      // 'try' is used in the legacy platform
      if (authOptions.mode === 'optional' || authOptions.mode === 'try') {
        return 'optional';
      }
      if (authOptions.mode === 'required') {
        return true;
      }
    }

    // legacy platform routes
    if (authOptions === undefined) {
      return true;
    }

    // @ts-expect-error According to @types/hapi__hapi, `route.settings` should be of type `RouteSettings`, but it's actually `RouteOptions` (https://github.com/hapijs/hapi/blob/v20.2.1/lib/route.js#L134)
    if (authOptions === false) return false;
    throw new Error(
      `unexpected authentication options: ${JSON.stringify(authOptions)} for route: ${
        this.url.pathname
      }${this.url.search}`
    );
  }
}

/**
 * Returns underlying Hapi Request
 * @internal
 */
export const ensureRawRequest = (request: OpenSearchDashboardsRequest | LegacyRequest) =>
  isOpenSearchDashboardsRequest(request) ? request[requestSymbol] : request;

/**
 * Checks if an incoming request is a {@link OpenSearchDashboardsRequest}
 * @internal
 */
export function isOpenSearchDashboardsRequest(
  request: unknown
): request is OpenSearchDashboardsRequest {
  return request instanceof OpenSearchDashboardsRequest;
}

function isRequest(request: any): request is LegacyRequest {
  try {
    return request.raw.req && typeof request.raw.req === 'object';
  } catch {
    return false;
  }
}

/**
 * Checks if an incoming request either OpenSearchDashboardsRequest or Legacy.Request
 * @internal
 */
export function isRealRequest(
  request: unknown
): request is OpenSearchDashboardsRequest | LegacyRequest {
  return isOpenSearchDashboardsRequest(request) || isRequest(request);
}
