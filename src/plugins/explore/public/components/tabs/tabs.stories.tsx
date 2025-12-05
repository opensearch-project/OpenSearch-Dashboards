/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { i18n } from '@osd/i18n';
import React from 'react';
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import { DocViewsRegistry } from '../../types/doc_views_types';
import { DocViewTable } from '../doc_viewer/doc_viewer_table/table';
import { JsonCodeBlock } from '../doc_viewer/json_code_block/json_code_block';
import { ExploreTabs } from './tabs';

export default {
  component: ExploreTabs,
  title: 'src/plugins/explore/public/components/tabs/tabs',
} as ComponentMeta<typeof ExploreTabs>;

const Template: ComponentStory<typeof ExploreTabs> = () => <ExploreTabs />;

export const Primary = Template.bind({});

const docViewsRegistry = new DocViewsRegistry();
docViewsRegistry.addDocView({
  title: i18n.translate('explore.docViews.table.tableTitle', {
    defaultMessage: 'Table',
  }),
  order: 10,
  component: DocViewTable,
});
docViewsRegistry.addDocView({
  title: i18n.translate('explore.docViews.json.jsonTitle', {
    defaultMessage: 'JSON',
  }),
  order: 20,
  component: JsonCodeBlock,
});

Primary.args = {};
