/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DeveloperExamplesSetup } from '../../developer_examples/public';
import { CoreStart } from '../../../src/core/public';
import { UiActionsSetup, UiActionsStart } from '../../../src/plugins/ui_actions/public';

export interface UiActionsExplorerPluginStart {
  uiActions: UiActionsStart;
}

export interface UiActionsExplorerPluginSetup {
  uiActions: UiActionsSetup;
  developerExamples: DeveloperExamplesSetup;
}

export interface UiActionsExplorerStartDependencies {
  uiActions: UiActionsStart;
}

export interface UiActionsExplorerServices extends CoreStart {
  uiActions: UiActionsStart;
}
