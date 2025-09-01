/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coerceStatusCode } from '.';

describe('coerceStatusCode', () => {
  it('should return 503 when input is 500', () => {
    expect(coerceStatusCode(500)).toBe(503);
  });

  it('should return the input status code when it is not 500', () => {
    expect(coerceStatusCode(404)).toBe(404);
  });

  it('should return 503 when input is undefined or null', () => {
    expect(coerceStatusCode((undefined as unknown) as number)).toBe(503);
    expect(coerceStatusCode((null as unknown) as number)).toBe(503);
  });
});
