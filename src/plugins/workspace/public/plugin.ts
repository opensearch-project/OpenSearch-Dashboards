/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { Plugin } from '../../../core/public';

export class WorkspacePlugin implements Plugin<{}, {}, {}> {
  public async setup() {
    return {};
  }

  public start() {
    return {};
  }

  public stop() {}
}
