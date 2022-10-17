/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Schemas } from '../../../../../vis_default_editor/public';
import { Dropbox } from './dropbox';
import { Title } from './title';

export const mapSchemaToAggPanel = (schemas: Schemas) => {
  const panelComponents = schemas.all.map((schema) => {
    return <Dropbox key={schema.name} id={schema.name} label={schema.title} schema={schema} />;
  });

  return (
    <>
      <Title title="Configuration" />
      <div className="vbConfig__content">{panelComponents}</div>
    </>
  );
};
