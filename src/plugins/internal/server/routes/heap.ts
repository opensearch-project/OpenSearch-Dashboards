/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment';

import {
  getHeapStatistics,
  getHeapSpaceStatistics,
  getHeapCodeStatistics,
  writeHeapSnapshot,
} from 'node:v8';
import { createReadStream } from 'fs';
import { Stream } from 'stream';
import { IRouter } from 'opensearch-dashboards/server';

const SNAPSHOT_BASE_PATH = '.heap_snapshots';

export function registerHeapRoute(router: IRouter) {
  router.get(
    {
      path: '/api/internal/heap/stats',
      validate: false,
    },
    async (context, request, response) => {
      const stats = getHeapStatistics();
      return response.ok({
        body: {
          heap: stats,
        },
      });
    }
  );

  router.get(
    {
      path: '/api/internal/heap/snapshot',
      validate: false,
    },
    async (context, request, response) => {
      const filename = `${moment.utc().format('YYYY-MM-DD-HH-mm-ss')}-${process.pid}.heapsnapshot`;
      const path = writeHeapSnapshot(`${SNAPSHOT_BASE_PATH}/${filename}`);

      const stream = new Stream.PassThrough();
      createReadStream(path).pipe(stream);
      return response.ok({
        body: {
          heap_snapshot: stream,
        },
      });
    }
  );

  router.get(
    {
      path: '/api/internal/heap/space/stats',
      validate: false,
    },
    async (context, request, response) => {
      const stats = getHeapSpaceStatistics();
      return response.ok({
        body: {
          heap_space: stats,
        },
      });
    }
  );

  router.get(
    {
      path: '/api/internal/heap/code/stats',
      validate: false,
    },
    async (context, request, response) => {
      const stats = getHeapCodeStatistics();
      return response.ok({
        body: {
          heap_code: stats,
        },
      });
    }
  );
}
