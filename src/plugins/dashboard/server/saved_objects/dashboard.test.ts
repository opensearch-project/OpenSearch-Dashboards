/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getDashboardSavedObjectType } from './dashboard';

describe('getDashboardSavedObjectType - variablesJSON feature flag', () => {
  it('is a dashboard type with the common fields regardless of the flag', () => {
    const type = getDashboardSavedObjectType(false);
    expect(type.name).toBe('dashboard');
    const props = type.mappings.properties as Record<string, unknown>;
    expect(props.title).toBeDefined();
    expect(props.panelsJSON).toBeDefined();
    expect(props.optionsJSON).toBeDefined();
  });

  it('does NOT register variablesJSON in the mapping when the feature is disabled', () => {
    const type = getDashboardSavedObjectType(false);
    const props = type.mappings.properties as Record<string, unknown>;
    // Field absent -> upgrades do not change the dashboard mapping hash ->
    // no saved-object migration is triggered for it (safe for multi-tenancy / AOS).
    expect(props.variablesJSON).toBeUndefined();
  });

  it('registers variablesJSON (text, index:false) when the feature is enabled', () => {
    const type = getDashboardSavedObjectType(true);
    const props = type.mappings.properties as Record<string, unknown>;
    expect(props.variablesJSON).toEqual({ type: 'text', index: false });
  });
});
