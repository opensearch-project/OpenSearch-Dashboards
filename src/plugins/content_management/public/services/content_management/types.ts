export interface PageConfig {
  id: string;
  title?: string;
  description?: string;
}

export type Section =
  | {
      kind: 'custom';
      id: string;
      order: number;
      title?: string;
      description?: string;
      render?: (contents: Map<string, Content>) => React.ReactNode;
    }
  | {
      kind: 'dashboard';
      id: string;
      order: number;
      title?: string;
      description?: string;
    };

export type Content =
  | {
      kind: 'visualization';
      id: string;
      order: number;
      input: VisualizationInput;
    }
  | {
      kind: 'custom';
      id: string;
      order: number;
      render: () => React.ReactElement;
    };

export type VisualizationInput =
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
