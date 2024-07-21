/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

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
    }
  | {
      kind: 'card';
      id: string;
      order: number;
      title?: string;
    };

export type Content =
  | {
      kind: 'visualization';
      id: string;
      order: number;
      input: SavedObjectInput;
    }
  | {
      kind: 'dashboard';
      id: string;
      order: number;
      input: SavedObjectInput;
    }
  | {
      kind: 'custom';
      id: string;
      order: number;
      render: () => JSX.Element;
    }
  | {
      kind: 'card';
      id: string;
      order: number;
      title: string;
      description: string;
      onClick?: () => void;
      getIcon?: () => React.ReactElement;
      getFooter?: () => React.ReactElement;
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
  getTargetArea: () => string;
}
