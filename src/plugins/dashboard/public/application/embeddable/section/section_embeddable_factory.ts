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

// Mirrors
// PlaceholderEmbeddableFactory exactly -- registered the same way in
// plugin.tsx's setup() via embeddable.registerEmbeddableFactory().

import { i18n } from '@osd/i18n';
import { EmbeddableFactoryDefinition, IContainer } from '../../../../../embeddable/public';
import {
  SectionEmbeddable,
  DashboardSectionEmbeddableInput,
  DASHBOARD_SECTION_EMBEDDABLE,
} from './section_embeddable';

export class SectionEmbeddableFactory implements EmbeddableFactoryDefinition {
  public readonly type = DASHBOARD_SECTION_EMBEDDABLE;

  public async isEditable() {
    return false;
  }

  // Sections are created via the "Add section" top-nav action, not via the
  // generic add-panel flow.
  public canCreateNew() {
    return false;
  }

  public async create(initialInput: DashboardSectionEmbeddableInput, parent?: IContainer) {
    return new SectionEmbeddable(initialInput, parent);
  }

  public getDisplayName() {
    return i18n.translate('dashboard.section.factory.displayName', {
      defaultMessage: 'section',
    });
  }
}
