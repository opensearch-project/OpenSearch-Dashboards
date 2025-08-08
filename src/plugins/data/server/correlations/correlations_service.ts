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

import { CoreSetup } from '../../../../core/server';
import { correlationsSavedObjectType } from '../saved_objects';

export class CorrelationsService {
  public setup(core: CoreSetup) {
    core.savedObjects.registerType(correlationsSavedObjectType);
  }
}
