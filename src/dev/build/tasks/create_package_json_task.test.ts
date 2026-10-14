/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getBuildResolutions } from './create_package_json_task';

describe('getBuildResolutions', () => {
  it('drops the extract-zip shim resolution', () => {
    expect(
      getBuildResolutions({
        '**/extract-zip': 'file:./scripts/extract_zip_shim',
        '**/js-yaml': '^4.3.2',
      })
    ).toEqual({ '**/js-yaml': '^4.3.2' });
  });

  it('keeps all other resolutions', () => {
    const resolutions = { '**/tar': '^7.5.22', '**/js-cookie': '^3.0.8' };
    expect(getBuildResolutions(resolutions)).toEqual(resolutions);
  });

  it('handles missing resolutions', () => {
    expect(getBuildResolutions(undefined)).toEqual({});
  });
});
