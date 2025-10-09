/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EmbeddableInput, EmbeddableOutput } from '../../../embeddable/public';

export interface AiVisInput extends EmbeddableInput {
  title?: string;
  savedObjectId?: string;
  visualizationData?: any;
}

export interface AiVisOutput extends EmbeddableOutput {
  savedObjectId?: string;
  editUrl?: string;
  indexPatterns?: string[];
}
