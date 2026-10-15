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
 * Type shim for `@hapi/inert`, mapped via `paths` in tsconfig.base.json.
 *
 * inert declares its additions to hapi through `declare module '@hapi/hapi'`.
 * hapi 21 declares ResponseToolkit in lib/types/response.d.ts and
 * HandlerDecorations in lib/types/route.d.ts and re-exports both from its
 * entry point; under the TypeScript 4.0.2 this branch pins, that augmentation
 * replaces hapi's own declaration instead of merging with it, leaving
 * ResponseToolkit with only inert's `file` member. Pointing the augmentation at
 * the module that holds the original declaration makes all declarations merge,
 * so hapi's own typings stay intact.
 *
 * The plugin's option shapes are kept loose here rather than restated, so the
 * fields of `handler: { directory: ... }` are not checked. Runtime is
 * unaffected.
 */

import { ResponseObject } from '@hapi/hapi';

declare namespace inert {
  type RequestHandler<T> = (request: any) => T;

  interface ReplyFileHandlerOptions {
    [option: string]: any;
  }

  interface FileHandlerRouteObject {
    path: string | RequestHandler<string>;
    [option: string]: any;
  }

  interface DirectoryHandlerRouteObject {
    path: string | string[] | RequestHandler<string | string[] | Error>;
    [option: string]: any;
  }

  interface OptionalRegistrationOptions {
    etagsCacheMaxSize?: number | undefined;
  }
}

declare const inert: { plugin: any };

export = inert;

declare module '@hapi/hapi/lib/types/route' {
  interface HandlerDecorations {
    file?: string | inert.RequestHandler<string> | inert.FileHandlerRouteObject | undefined;
    directory?: inert.DirectoryHandlerRouteObject | undefined;
    files?: { relativeTo: string } | undefined;
  }
}

declare module '@hapi/hapi/lib/types/response' {
  interface ResponseToolkit {
    file(path: string, options?: inert.ReplyFileHandlerOptions): ResponseObject;
  }
}
