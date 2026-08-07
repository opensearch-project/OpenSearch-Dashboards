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

import expect from '@osd/expect';
import { toScopeArray } from './to_scope_array';
import { UiSettingScope } from '../../../../../core/public';

describe('toScopeArray', () => {
  it('wraps a single scope in an array', () => {
    expect(toScopeArray(UiSettingScope.USER)).to.eql([UiSettingScope.USER]);
    expect(toScopeArray(UiSettingScope.WORKSPACE)).to.eql([UiSettingScope.WORKSPACE]);
  });

  it('returns an array of scopes unchanged', () => {
    const scopes = [UiSettingScope.GLOBAL, UiSettingScope.USER];
    expect(toScopeArray(scopes)).to.eql(scopes);
  });

  it('treats an unscoped (undefined) setting as GLOBAL', () => {
    expect(toScopeArray(undefined)).to.eql([UiSettingScope.GLOBAL]);
  });

  it('returns an empty array unchanged', () => {
    expect(toScopeArray([])).to.eql([]);
  });
});
