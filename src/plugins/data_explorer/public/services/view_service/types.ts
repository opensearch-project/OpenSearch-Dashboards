/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Slice } from '@reduxjs/toolkit';
import { LazyExoticComponent } from 'react';
import { LocationState } from 'history';
import { AppMountParameters } from '../../../../../core/public';

interface ViewListItem {
  id: string;
  label: string;
}

export interface ViewProps extends AppMountParameters {
  redirectState: LocationState;
}

export interface ViewDefinition<T = any> {
  readonly id: string;
  readonly title: string;
  readonly ui?: {
    defaults: T | (() => T) | (() => Promise<T>);
    slice: Slice<T>;
  };
  readonly Canvas: LazyExoticComponent<(props: ViewProps) => React.ReactElement>;
  readonly Panel: LazyExoticComponent<(props: ViewProps) => React.ReactElement>;
  readonly defaultPath: string;
  readonly appExtentions: {
    savedObject: {
      docTypes: [string];
      toListItem: (obj: { id: string; title: string }) => ViewListItem;
    };
  };
  readonly shouldShow?: (state: any) => boolean;
}
