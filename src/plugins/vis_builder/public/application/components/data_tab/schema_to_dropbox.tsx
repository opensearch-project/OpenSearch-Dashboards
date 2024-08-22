/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { Schemas } from '../../../../../vis_default_editor/public';
import { Dropbox } from './dropbox';
import { Title } from './title';
import { AggProps } from './config_panel';
import { SchemaDisplayStates } from '.';

export const mapSchemaToAggPanel = (
  schemas: Schemas,
  aggProps: AggProps,
  activeSchemaFields: SchemaDisplayStates,
  setActiveSchemaFields: React.Dispatch<React.SetStateAction<SchemaDisplayStates>>,
  isDragging: boolean
) => {
  const panelComponents = schemas.all.map((schema) => {
    return (
      <Dropbox
        key={schema.name}
        id={schema.name}
        label={schema.title}
        schema={schema}
        aggProps={aggProps}
        activeSchemaFields={activeSchemaFields}
        setActiveSchemaFields={setActiveSchemaFields}
        isDragging={isDragging}
      />
    );
  });

  return (
    <>
      <Title title="Configuration" />
      <div className="vbConfig__content">{panelComponents}</div>
    </>
  );
};
