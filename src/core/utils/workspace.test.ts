/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getWorkspaceIdFromUrl, formatUrlWithWorkspaceId } from './workspace';
import { httpServiceMock } from '../public/mocks';

describe('#getWorkspaceIdFromUrl', () => {
  it('return workspace when there is a match', () => {
    expect(getWorkspaceIdFromUrl('http://localhost/w/foo')).toEqual('foo');
  });

  it('return empty when there is not a match', () => {
    expect(getWorkspaceIdFromUrl('http://localhost/w2/foo')).toEqual('');
  });
});

describe('#formatUrlWithWorkspaceId', () => {
  const basePathWithoutWorkspaceBasePath = httpServiceMock.createSetupContract().basePath;
  it('return url with workspace prefix when format with a id provided', () => {
    expect(
      formatUrlWithWorkspaceId('/app/dashboard', 'foo', basePathWithoutWorkspaceBasePath)
    ).toEqual('http://localhost/w/foo/app/dashboard');
  });

  it('return url without workspace prefix when format without a id', () => {
    expect(
      formatUrlWithWorkspaceId('/w/foo/app/dashboard', '', basePathWithoutWorkspaceBasePath)
    ).toEqual('http://localhost/app/dashboard');
  });
});
