/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreSetup } from '../../../../core/server';
import { correlationsSavedObjectType } from '../saved_objects';

export class CorrelationsService {
  public setup(core: CoreSetup) {
    core.savedObjects.registerType(correlationsSavedObjectType);
  }
}
