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
 * Type shim for `@hapi/h2o2`, mapped via `paths` in tsconfig.base.json. See
 * typings/hapi_inert.d.ts for why the augmentation targets hapi's inner
 * modules rather than '@hapi/hapi'.
 *
 * `protocol` is restated because base_path_proxy_server.ts reads
 * `ProxyHandlerOptions['protocol']`; the remaining option fields are left loose
 * rather than restated, so the contents of `handler: { proxy: ... }` are not
 * checked. Runtime is unaffected.
 */

import { ResponseObject } from '@hapi/hapi';

declare namespace h2o2 {
  interface ProxyTarget {
    uri: string;
    headers?: { [key: string]: string } | undefined;
  }

  interface ProxyHandlerOptions {
    host?: string | undefined;
    port?: number | string | undefined;
    protocol?: 'http' | 'https' | undefined;
    [option: string]: any;
  }
}

declare const h2o2: { plugin: any };

export = h2o2;

declare module '@hapi/hapi/lib/types/route' {
  interface HandlerDecorations {
    proxy?: h2o2.ProxyHandlerOptions | undefined;
  }
}

declare module '@hapi/hapi/lib/types/response' {
  interface ResponseToolkit {
    proxy(options: h2o2.ProxyHandlerOptions): Promise<ResponseObject>;
  }
}
