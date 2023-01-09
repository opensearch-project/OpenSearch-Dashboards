/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useRef, useEffect } from 'react';
import { monaco } from '@osd/monaco';

export function useDiagnosticsOptions(props: {
  monaco?: typeof monaco;
  diagnosticsOptions?: monaco.languages.json.DiagnosticsOptions;
}) {
  useEffect(() => {
    const oldOptionsSettings = props.monaco?.languages.json.jsonDefaults.diagnosticsOptions;
    if (props.monaco) {
      props.monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        ...oldOptionsSettings,
        ...props.diagnosticsOptions,
        schemas: [
          ...(oldOptionsSettings?.schemas || []),
          ...(props.diagnosticsOptions?.schemas || []),
        ],
      });
    }
    return () => {
      props.monaco?.languages.json.jsonDefaults.setDiagnosticsOptions(oldOptionsSettings || {});
    };
  }, [props.monaco, props.diagnosticsOptions]);
}

const jsonCode = ['{', '    "p1": "v3",', '    "p2": false', '}'].join('\n');
const modelUri = monaco.Uri.parse('a://b/foo.json');
const model = monaco.editor.createModel(jsonCode, 'json', modelUri);

export function JsonEditorWithDiagnosticsOptions() {
  const containerRef = useRef<HTMLDivElement>(null);
  useDiagnosticsOptions({
    monaco,
    diagnosticsOptions: {
      validate: true,
      schemas: [
        {
          uri: 'http://myserver/foo-schema.json',
          fileMatch: ['*'],
          schema: {
            type: 'object',
            properties: {
              p1: {
                enum: ['v1', 'v2'],
              },
              p2: {
                $ref: 'http://myserver/bar-schema.json',
              },
            },
          },
        },
        {
          uri: 'http://myserver/bar-schema.json', // id of the second schema
          schema: {
            type: 'object',
            properties: {
              q1: {
                enum: ['x1', 'x2'],
              },
            },
          },
        },
      ],
    },
  });
  useEffect(() => {
    monaco.editor.create(containerRef.current as HTMLDivElement, {
      model,
    });
  }, []);
  return <div ref={containerRef} />;
}
