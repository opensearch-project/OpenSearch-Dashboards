/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AxisFormat {
  id: string;
}

export interface AxisFormats {
  xAxisLabel?: string;
  yAxisLabel?: string;
  zAxisLabel?: string;
  xAxisFormat?: AxisFormat;
  yAxisFormat?: AxisFormat;
  zAxisFormat?: AxisFormat;
}

// Define a VegaLiteSpec interface
export interface VegaLiteSpec {
  $schema: string;
  data: {
    values: any[];
  };
  mark: {
    type: string;
    [key: string]: any;
  };
  encoding: {
    [key: string]: {
      field: string;
      type: string;
      title?: string;
      [key: string]: any;
    };
  };
  transform?: Array<{
    calculate: string;
    as: string;
  }>;
  layer?: VegaSpec[];
  config?: {
    legend?: any;
    [key: string]: any;
  };
}

// Define a more general VegaSpec interface
export interface VegaSpec {
  $schema: string;
  padding?: number | { [key: string]: number };
  data: Array<{
    name: string;
    values?: any[];
    source?: string;
    transform?: Array<{
      type: string;
      [key: string]: any;
    }>;
  }>;
  signals?: Array<{
    name: string;
    update: string;
    [key: string]: any;
  }>;
  scales?: Array<{
    name: string;
    type: string;
    domain: any;
    range: any;
    [key: string]: any;
  }>;
  layout?: {
    [key: string]: any;
  };
  marks: Array<{
    type: string;
    from?: any;
    encode?: {
      [key: string]: any;
    };
    signals?: Array<{
      name: string;
      update: string;
    }>;
    scales?: any[];
    axes?: Array<{
      orient: string;
      scale: string;
      [key: string]: any;
    }>;
    title?: {
      [key: string]: any;
    };
    marks?: any[];
    [key: string]: any;
  }>;
  legends?: Array<{
    [key: string]: any;
  }>;
  [key: string]: any; // Allow for additional properties
}
