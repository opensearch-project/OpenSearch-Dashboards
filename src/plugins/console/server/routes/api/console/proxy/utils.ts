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

import { Stream } from 'stream';

export const buildBufferedBody = (body: Stream): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    let buff: Buffer = Buffer.alloc(0);

    body.on('data', function (chunk: Buffer) {
      buff = Buffer.concat([buff, chunk]);
    });

    body.on('end', function () {
      resolve(buff);
    });

    body.on('error', function (err) {
      reject(err);
    });
  });
};
