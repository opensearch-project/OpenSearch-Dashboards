/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EmbeddableFactoryDefinition, IContainer } from '../../../embeddable/public';
import {
  CUSTOM_CONTENT_EMBEDDABLE,
  CustomContentEmbeddable,
  CustomContentEmbeddableInput,
} from './custom_content_embeddable';

export class CustomContentEmbeddableFactoryDefinition implements EmbeddableFactoryDefinition {
  public readonly type = CUSTOM_CONTENT_EMBEDDABLE;

  public async isEditable() {
    return false;
  }

  public async create(initialInput: CustomContentEmbeddableInput, parent?: IContainer) {
    return new CustomContentEmbeddable(initialInput, parent);
  }

  public getDisplayName() {
    return i18n.translate('contentManagement.embeddable.customContent', {
      defaultMessage: 'Content',
    });
  }
}
