/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreStart, NotificationsStart } from '../../../src/core/public';
import { ExpressionsSetup, ExpressionsStart } from '../../../src/plugins/expressions/public';
import { NavigationPublicPluginStart } from '../../../src/plugins/navigation/public';
import { DeveloperExamplesSetup } from '../../developer_examples/public';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ExpressionsExamplePluginSetup {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ExpressionsExamplePluginStart {}

export interface ExpressionsExampleSetupDependencies {
  expressions: ExpressionsSetup;
  developerExamples: DeveloperExamplesSetup;
}

export interface ExpressionsExampleStartDependencies {
  navigation: NavigationPublicPluginStart;
  expressions: ExpressionsStart;
}

export interface ExpressionsExampleServices extends CoreStart {
  expressions: ExpressionsStart;
  notifications: NotificationsStart;
}
