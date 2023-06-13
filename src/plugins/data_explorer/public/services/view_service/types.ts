/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { ReactElement } from 'react';

// TODO: Correctly type this file.

interface ViewListItem {
  id: string;
  label: string;
}

export interface ViewDefinition<T = any> {
  readonly id: string;
  readonly title: string;
  readonly ui: {
    panel: ReactElement;
    canvas: ReactElement;
    defaults: T;
    reducer: (state: T, action: any) => T;
  };
  readonly defaultPath: string;
  readonly appExtentions: {
    savedObject: {
      docTypes: [string];
      toListItem: (obj: { id: string; title: string }) => ViewListItem;
    };
  };
  readonly shouldShow?: (state: any) => boolean;
}
