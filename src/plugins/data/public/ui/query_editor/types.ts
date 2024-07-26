/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LanguageEditor<T = {}> {
  TopBar: {
    Expanded: React.ComponentType<T> | React.ReactElement | null;
    Collapsed: React.ComponentType<T> | React.ReactElement;
  };
  Body: React.ComponentType<{}> | React.ReactElement;
}
