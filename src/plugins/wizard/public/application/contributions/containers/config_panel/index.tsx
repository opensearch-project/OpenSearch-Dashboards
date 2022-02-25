/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiForm, EuiIcon } from '@elastic/eui';
import React, { useState } from 'react';
import {
  CONTAINER_ID,
  DroppableBoxContribution,
  TitleItemContribution,
  ItemContribution,
} from './types';
import { useVisualizationType } from '../../../utils/use';

import './index.scss';
import { DroppableBox } from './items/droppable_box';
import { SuperSelectField } from '../common/items/super_select_field';
import { Title } from './title';
import { useDropBox } from './items/use';

const DEFAULT_ITEMS: ItemContribution[] = [
  {
    type: 'title',
    title: 'Configuration',
  },
];

export function ConfigPanel() {
  const [showSecondary, setShowSecondary] = useState(false);
  const {
    contributions: { items },
  } = useVisualizationType();

  const hydratedItems = [...(items?.[CONTAINER_ID] ?? []), ...DEFAULT_ITEMS];

  const { title, droppableBoxes } = getMainPanelData(hydratedItems);

  return (
    <EuiForm className={`wizConfig ${showSecondary ? 'showSecondary' : ''}`}>
      <div className="wizConfig__section">
        <Title title={title} />
        <div className="wizConfig__content">
          {droppableBoxes.map((props, index) => (
            <StatefulDroppableBox key={index} {...props} />
          ))}
        </div>
      </div>
      <div className="wizConfig__section wizConfig--secondary">
        <Title
          title="Test Stuff"
          icon={<EuiIcon type="arrowLeft" onClick={() => setShowSecondary(false)} />}
          showDivider
        />
        <div className="wizConfig__content">
          <SuperSelectField
            label="Test dropdown"
            options={[
              {
                value: 'option_one',
                inputDisplay: 'Option One',
                'data-test-subj': 'option one',
              },
            ]}
          />
        </div>
      </div>
    </EuiForm>
  );
}

function getMainPanelData(items: ItemContribution[]) {
  const titleContribution: TitleItemContribution = items.filter(
    ({ type }) => type === 'title'
  )[0] as TitleItemContribution;

  const droppableBoxContributions: DroppableBoxContribution[] = items.filter(
    ({ type }) => type === 'droppable_box'
  ) as DroppableBoxContribution[];

  const droppableBoxes = droppableBoxContributions.map(({ label, id, limit }) => ({
    id,
    label,
    limit,
  }));

  return {
    title: titleContribution.title,
    droppableBoxes,
  };
}

interface DroppableBoxProps {
  id: string;
  label: string;
  limit?: number;
}

const StatefulDroppableBox = ({ id, ...props }: DroppableBoxProps) => {
  const droppableHookProps = useDropBox(id);

  return <DroppableBox {...props} {...droppableHookProps} />;
};

export { CONTAINER_ID, TitleItemContribution, ItemContribution, DEFAULT_ITEMS };
