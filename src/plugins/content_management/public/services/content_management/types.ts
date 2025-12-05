/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiCardProps } from '@elastic/eui';
import { CardContainerExplicitInput } from '../../components/card_container/types';
import { DashboardContainerExplicitInput } from '../../components/types';

export interface PageConfig {
  id: string;
  title?: string;
  description?: string;
  sections?: Section[];
}

export type Section =
  | {
      kind: 'custom';
      id: string;
      order: number;
      title?: string;
      description?: string;
      render: (contents: Content[]) => JSX.Element;
    }
  | {
      kind: 'dashboard';
      id: string;
      order: number;
      title?: string;
      description?: string;
      input?: DashboardContainerExplicitInput;
    }
  | {
      kind: 'card';
      id: string;
      order: number;
      title?: string;
      collapsible?: boolean;
      input?: CardContainerExplicitInput;
      columns?: number;
      wrap?: boolean;
      grid?: boolean;
    };

export type Content =
  | {
      kind: 'visualization';
      id: string;
      order: number;
      input: SavedObjectInput;
      width?: number;
      height?: number;
    }
  | {
      kind: 'dashboard';
      id: string;
      order: number;
      input: SavedObjectInput;
      width?: number;
      height?: number;
    }
  | {
      kind: 'custom';
      id: string;
      order: number;
      render: () => JSX.Element;
      width?: number;
      height?: number;
    }
  | {
      kind: 'card';
      id: string;
      order: number;
      title?: string;
      description: string;
      toolTipContent?: string;
      getTitle?: () => React.ReactElement;
      onClick?: () => void;
      getIcon?: () => React.ReactElement;
      getFooter?: () => React.ReactElement;
      cardProps?: Omit<EuiCardProps, 'title' | 'description'>;
    };

export type SavedObjectInput =
  | {
      kind: 'static';
      /**
       * The visualization id
       */
      id: string;
    }
  | {
      kind: 'dynamic';
      /**
       * A promise that returns a visualization id
       */
      get: () => Promise<string>;
    };

export interface ContentProvider {
  id: string;
  getContent: () => Content;
  getTargetArea: () => string | string[];
}
