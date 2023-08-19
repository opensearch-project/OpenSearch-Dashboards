/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { configure, shallow, ShallowWrapper } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
// @ts-ignore
import { DatasourcePicker } from './datasource_picker';
import { IDatasourceListOption, IDatasourcePickerProps } from '../types';
import { SOURCE_PICKER_FOOTER_SELECT_BTN_TEST_SUBJ } from './constants';
import { OuiSelectable } from '@elastic/eui';

configure({ adapter: new Adapter() });

const dsOptions = [
  { title: '[cluster1].opensearch-dashboards-sample-data-flights' },
  { title: '[cluster1].opensearch-dashboards-sample-data-log' },
  { title: '[cluster2].opensearch-dashboards-sample-data-flights' },
  { title: '[cluster2].opensearch-dashboards-sample-data-log' },
  { title: 'opensearch-dashboards-sample-data-log' },
  { title: 'Spark_S3_sales' },
  { title: 'Spark_S3_Internal' },
] as IDatasourceListOption[];

const props = {
  datasourceList: [...dsOptions],
  onSelect: jest.fn(),
} as IDatasourcePickerProps;

const getSourcePickerList = (instance: ShallowWrapper) => {
  return instance.find(OuiSelectable);
};

const getSourcePickerOptions = (instance: ShallowWrapper) => {
  return getSourcePickerList(instance).prop('options');
};

const selectSourcePickerOption = (instance: ShallowWrapper, selectedLabel: string) => {
  const options: Array<{ label: string; checked?: 'on' | 'off' }> = getSourcePickerOptions(
    instance
  ).map((option: any) =>
    option.label === selectedLabel
      ? { ...option, checked: 'on' }
      : { ...option, checked: undefined }
  );
  return getSourcePickerList(instance).prop('onChange')!(options);
};

const clickSelect = (instance: ShallowWrapper) => {
  instance
    .find(`[data-test-subj="${SOURCE_PICKER_FOOTER_SELECT_BTN_TEST_SUBJ}"]`)
    .simulate('click');
};

describe('Select datasource', () => {
  it('Should allow selecting a datasource', () => {
    const instance = shallow(<DatasourcePicker {...props} />);
    selectSourcePickerOption(instance, 'Spark_S3_sales');
    clickSelect(instance);
    expect(props.onSelect).toHaveBeenCalledWith({ title: 'Spark_S3_sales' });
  });
});

describe('Render datasource picker', () => {
  it('Should render component and match sanpshots', () => {
    expect(shallow(<DatasourcePicker {...props} />)).toMatchInlineSnapshot(`
      <OuiPopover
        anchorPosition="downLeft"
        button={
          <OuiButton
            data-test-subj="sourcePickerButton"
            iconSide="right"
            iconType="arrowDown"
            onClick={[Function]}
            size="s"
            style={
              Object {
                "width": "300px",
              }
            }
          >
            Select a datasource
          </OuiButton>
        }
        closePopover={[Function]}
        display="inlineBlock"
        hasArrow={true}
        id="contextMenuExample"
        isOpen={false}
        ownFocus={true}
        panelPaddingSize="none"
      >
        <OuiPopoverTitle>
          available sources
        </OuiPopoverTitle>
        <OuiSelectable
          aria-label="Multi-selectable source panel"
          data-test-subj="selectableDatasourcePanel"
          isPreFiltered={false}
          listProps={
            Object {
              "bordered": true,
            }
          }
          onChange={[Function]}
          options={
            Array [
              Object {
                "checked": undefined,
                "label": "[cluster1].opensearch-dashboards-sample-data-flights",
              },
              Object {
                "checked": undefined,
                "label": "[cluster1].opensearch-dashboards-sample-data-log",
              },
              Object {
                "checked": undefined,
                "label": "[cluster2].opensearch-dashboards-sample-data-flights",
              },
              Object {
                "checked": undefined,
                "label": "[cluster2].opensearch-dashboards-sample-data-log",
              },
              Object {
                "checked": undefined,
                "label": "opensearch-dashboards-sample-data-log",
              },
              Object {
                "checked": undefined,
                "label": "Spark_S3_sales",
              },
              Object {
                "checked": undefined,
                "label": "Spark_S3_Internal",
              },
            ]
          }
          searchProps={
            Object {
              "data-test-subj": "selectableDatasourcePanelSearch",
            }
          }
          searchable={true}
          singleSelection={true}
          style={
            Object {
              "width": "500px",
            }
          }
        >
          <Component />
        </OuiSelectable>
        <OuiPopoverFooter
          paddingSize="s"
        >
          <OuiFlexGroup>
            <OuiFlexItem
              grow={3}
            />
            <OuiFlexItem
              grow={false}
            >
              <OuiButton
                onClick={[Function]}
                size="s"
              >
                Cancel
              </OuiButton>
            </OuiFlexItem>
            <OuiFlexItem
              grow={false}
            >
              <OuiButton
                data-test-subj="datasourcePickerSelect"
                fill={true}
                onClick={[Function]}
                size="s"
              >
                Select
              </OuiButton>
            </OuiFlexItem>
          </OuiFlexGroup>
        </OuiPopoverFooter>
      </OuiPopover>
    `);
  });
});
