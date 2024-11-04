/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VegaEncoding } from '../components/encoding';
import { VegaLiteMark } from '../components/mark/mark';

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

// VegaLiteSpec interface
export interface VegaLiteSpec {
  $schema: string;
  data: {
    values: any[];
  };
  mark: VegaLiteMark;
  encoding: VegaEncoding;
  transform?: Array<{
    calculate: string;
    as: string;
  }>;
  layer?: LayerSpec[];
  config?: {
    legend?: any;
    [key: string]: any;
  };
  selection?: {
    legend_selection?: {
      type: string;
      fields: string[];
      bind: string;
    };
  };
}

export interface LayerSpec {
  mark: VegaLiteMark;
  encoding: VegaEncoding;
}

// VegaSpec interface
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
  } | null;
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
