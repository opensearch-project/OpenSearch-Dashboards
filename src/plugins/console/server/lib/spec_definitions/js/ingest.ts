/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { SpecDefinitionsService } from '../../../services';

const commonPipelineParams = {
  on_failure: [],
  ignore_failure: {
    __one_of: [false, true],
  },
  if: '',
  tag: '',
};

// Based on https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/processors/processors/
const appendProcessorDefinition = {
  append: {
    __template: {
      field: '',
      value: [],
    },
    field: '',
    value: [],
    ...commonPipelineParams,
  },
};

// Based on https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/processors/processors/
const bytesProcessorDefinition = {
  bytes: {
    __template: {
      field: '',
    },
    field: '',
    target_field: '',
    ignore_missing: {
      __one_of: [false, true],
    },
    ...commonPipelineParams,
  },
};

// Based on https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/processors/processors/
const circleProcessorDefinition = {
  circle: {
    __template: {
      field: '',
      error_distance: '',
      shape_type: '',
    },
    field: '',
    target_field: '',
    error_distance: '',
    shape_type: {
      __one_of: ['geo_shape', 'shape'],
    },
    ignore_missing: {
      __one_of: [false, true],
    },
    ...commonPipelineParams,
  },
};

// Based on https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/processors/csv/
const csvProcessorDefinition = {
  csv: {
    __template: {
      field: '',
      target_fields: [''],
    },
    field: '',
    target_fields: [''],
    separator: '',
    quote: '',
    empty_value: '',
    trim: {
      __one_of: [true, false],
    },
    ignore_missing: {
      __one_of: [false, true],
    },
    ...commonPipelineParams,
  },
};

// Based on https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/processors/processors/
const convertProcessorDefinition = {
  convert: {
    __template: {
      field: '',
      type: '',
    },
    field: '',
    type: {
      __one_of: ['integer', 'float', 'string', 'boolean', 'auto'],
    },
    target_field: '',
    ignore_missing: {
      __one_of: [false, true],
    },
    ...commonPipelineParams,
  },
};

// Based on https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/processors/date/
const dateProcessorDefinition = {
  date: {
    __template: {
      field: '',
      formats: [],
    },
    field: '',
    target_field: '@timestamp',
    formats: [],
    timezone: 'UTC',
    locale: 'ENGLISH',
    ...commonPipelineParams,
  },
};

// Based on https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/processors/processors/
const dateIndexNameProcessorDefinition = {
  date_index_name: {
    __template: {
      field: '',
      date_rounding: '',
    },
    field: '',
    date_rounding: {
      __one_of: ['y', 'M', 'w', 'd', 'h', 'm', 's'],
    },
    date_formats: [],
    timezone: 'UTC',
    locale: 'ENGLISH',
    index_name_format: 'yyyy-MM-dd',
    ...commonPipelineParams,
  },
};

// Based on https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/processors/processors/
const dissectProcessorDefinition = {
  dissect: {
    __template: {
      field: '',
      pattern: '',
    },
    field: '',
    pattern: '',
    append_separator: '',
    ignore_missing: {
      __one_of: [false, true],
    },
    ...commonPipelineParams,
  },
};

// Based on https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/processors/processors/
const dotExpanderProcessorDefinition = {
  dot_expander: {
    __template: {
      field: '',
    },
    field: '',
    path: '',
    ...commonPipelineParams,
  },
};

// Based on https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/processors/processors/
const dropProcessorDefinition = {
  drop: {
    __template: {},
    ...commonPipelineParams,
  },
};

// Based on https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/processors/processors/
const failProcessorDefinition = {
  fail: {
    __template: {
      message: '',
    },
    message: '',
    ...commonPipelineParams,
  },
};

// Based on https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/processors/processors/
const foreachProcessorDefinition = {
  foreach: {
    __template: {
      field: '',
      processor: {},
    },
    field: '',
    processor: {
      __scope_link: '_processor',
    },
    ...commonPipelineParams,
  },
};

// Based on https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/processors/processors/
const geoipProcessorDefinition = {
  geoip: {
    __template: {
      field: '',
    },
    field: '',
    target_field: '',
    database_file: '',
    properties: [''],
    ignore_missing: {
      __one_of: [false, true],
    },
    first_only: {
      __one_of: [false, true],
    },
  },
};

// Based on https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/processors/grok/
const grokProcessorDefinition = {
  grok: {
    __template: {
      field: '',
      patterns: [],
    },
    field: '',
    patterns: [],
    pattern_definitions: {},
    trace_match: {
      __one_of: [false, true],
    },
    ignore_missing: {
      __one_of: [false, true],
    },
    ...commonPipelineParams,
  },
};

// Based on https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/processors/processors/
const gsubProcessorDefinition = {
  gsub: {
    __template: {
      field: '',
      pattern: '',
      replacement: '',
    },
    field: '',
    pattern: '',
    replacement: '',
    ...commonPipelineParams,
  },
};

// Based on https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/processors/processors/
const htmlStripProcessorDefinition = {
  html_strip: {
    __template: {
      field: '',
    },
    field: '',
    target_field: '',
    ignore_missing: {
      __one_of: [false, true],
    },
    ...commonPipelineParams,
  },
};

// Based on https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/processors/processors/
const inferenceProcessorDefinition = {
  inference: {
    __template: {
      model_id: '',
      field_map: {},
      inference_config: {},
    },
    model_id: '',
    field_map: {},
    inference_config: {},
    target_field: '',
    ...commonPipelineParams,
  },
};

// Based on https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/processors/processors/
const joinProcessorDefinition = {
  join: {
    __template: {
      field: '',
      separator: '',
    },
    field: '',
    separator: '',
    ...commonPipelineParams,
  },
};

// Based on https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/processors/parse-json/
const jsonProcessorDefinition = {
  json: {
    __template: {
      field: '',
    },
    field: '',
    target_field: '',
    add_to_root: {
      __one_of: [false, true],
    },
    ...commonPipelineParams,
  },
};

// Based on https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/processors/processors/
const kvProcessorDefinition = {
  kv: {
    __template: {
      field: '',
      field_split: '',
      value_split: '',
    },
    field: '',
    field_split: '',
    value_split: '',
    target_field: '',
    include_keys: [],
    ignore_missing: {
      __one_of: [false, true],
    },
    ...commonPipelineParams,
  },
};

// Based on https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/processors/lowercase-string/
const lowercaseProcessorDefinition = {
  lowercase: {
    __template: {
      field: '',
    },
    field: '',
    ignore_missing: {
      __one_of: [false, true],
    },
    ...commonPipelineParams,
  },
};

// Based on https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/processors/processors/
const pipelineProcessorDefinition = {
  pipeline: {
    __template: {
      name: '',
    },
    name: '',
    ...commonPipelineParams,
  },
};

// Based on https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/processors/processors/
const removeProcessorDefinition = {
  remove: {
    __template: {
      field: '',
    },
    field: '',
    ...commonPipelineParams,
  },
};

// Based on https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/processors/processors/
const renameProcessorDefinition = {
  rename: {
    __template: {
      field: '',
      target_field: '',
    },
    field: '',
    target_field: '',
    ignore_missing: {
      __one_of: [false, true],
    },
    ...commonPipelineParams,
  },
};

// Based on https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/processors/processors/
const scriptProcessorDefinition = {
  script: {
    __template: {},
    lang: 'painless',
    file: '',
    id: '',
    source: '',
    params: {},
    ...commonPipelineParams,
  },
};

// Based on https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/processors/processors/
const setProcessorDefinition = {
  set: {
    __template: {
      field: '',
      value: '',
    },
    field: '',
    value: '',
    override: {
      __one_of: [true, false],
    },
    ...commonPipelineParams,
  },
};

// Based on https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/processors/processors/
const setSecurityUserProcessorDefinition = {
  set_security_user: {
    __template: {
      field: '',
    },
    field: '',
    properties: [''],
    ...commonPipelineParams,
  },
};

// Based on https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/processors/split-string/
const splitProcessorDefinition = {
  split: {
    __template: {
      field: '',
      separator: '',
    },
    field: '',
    separator: '',
    ignore_missing: {
      __one_of: [false, true],
    },
    ...commonPipelineParams,
  },
};

// Based on https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/processors/processors/
const sortProcessorDefinition = {
  sort: {
    __template: {
      field: '',
    },
    field: '',
    order: 'asc',
    ...commonPipelineParams,
  },
};

// Based on https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/processors/trim-string/
const trimProcessorDefinition = {
  trim: {
    __template: {
      field: '',
    },
    field: '',
    ignore_missing: {
      __one_of: [false, true],
    },
    ...commonPipelineParams,
  },
};

// Based on https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/processors/uppercase-string/
const uppercaseProcessorDefinition = {
  uppercase: {
    __template: {
      field: '',
    },
    field: '',
    ignore_missing: {
      __one_of: [false, true],
    },
    ...commonPipelineParams,
  },
};

// Based on https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/processors/processors/
const urlDecodeProcessorDefinition = {
  urldecode: {
    __template: {
      field: '',
    },
    field: '',
    target_field: '',
    ignore_missing: {
      __one_of: [false, true],
    },
    ...commonPipelineParams,
  },
};

// Based on https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/processors/processors/
const userAgentProcessorDefinition = {
  user_agent: {
    __template: {
      field: '',
    },
    field: '',
    target_field: '',
    regex_file: '',
    properties: [''],
    ignore_missing: {
      __one_of: [false, true],
    },
  },
};

const processorDefinition = {
  __one_of: [
    appendProcessorDefinition,
    bytesProcessorDefinition,
    csvProcessorDefinition,
    circleProcessorDefinition,
    convertProcessorDefinition,
    dateProcessorDefinition,
    dateIndexNameProcessorDefinition,
    dissectProcessorDefinition,
    dotExpanderProcessorDefinition,
    dropProcessorDefinition,
    failProcessorDefinition,
    foreachProcessorDefinition,
    geoipProcessorDefinition,
    grokProcessorDefinition,
    gsubProcessorDefinition,
    htmlStripProcessorDefinition,
    inferenceProcessorDefinition,
    joinProcessorDefinition,
    jsonProcessorDefinition,
    kvProcessorDefinition,
    lowercaseProcessorDefinition,
    pipelineProcessorDefinition,
    removeProcessorDefinition,
    renameProcessorDefinition,
    scriptProcessorDefinition,
    setProcessorDefinition,
    setSecurityUserProcessorDefinition,
    splitProcessorDefinition,
    sortProcessorDefinition,
    trimProcessorDefinition,
    uppercaseProcessorDefinition,
    urlDecodeProcessorDefinition,
    userAgentProcessorDefinition,
  ],
};

const pipelineDefinition = {
  description: '',
  processors: [processorDefinition],
  version: 123,
};

export const ingest = (specService: SpecDefinitionsService) => {
  // Note: this isn't an actual API endpoint. It exists so the forEach processor's "processor" field
  // may recursively use the autocomplete rules for any processor.
  specService.addEndpointDescription('_processor', {
    data_autocomplete_rules: processorDefinition,
  });

  specService.addEndpointDescription('ingest.put_pipeline', {
    methods: ['PUT'],
    patterns: ['_ingest/pipeline/{id}'],
    data_autocomplete_rules: pipelineDefinition,
  });

  specService.addEndpointDescription('ingest.simulate', {
    data_autocomplete_rules: {
      pipeline: pipelineDefinition,
      docs: [],
    },
  });
};
