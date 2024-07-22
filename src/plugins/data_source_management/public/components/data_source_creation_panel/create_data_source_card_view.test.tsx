/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import { EuiCard, EuiIcon } from '@elastic/eui';
import { CreateDataSourceCardView, DatasourceCard } from './create_data_source_card_view';
import { AMAZON_S3_URL, PROMETHEUS_URL, OPENSEARCH_URL } from '../../constants';
import { createMemoryHistory } from 'history';

describe('CreateDataSourceCardView', () => {
  const history = createMemoryHistory();
  const defaultProps = {
    history,
    featureFlagStatus: true,
  };

  const shallowComponent = (props = defaultProps) =>
    shallow(<CreateDataSourceCardView {...props} />);

  test('renders correctly', () => {
    const wrapper = shallowComponent();
    expect(wrapper).toMatchSnapshot();
  });

  test('renders correct datasource cards', () => {
    const wrapper = shallowComponent();
    const cards = wrapper.find(EuiCard);

    expect(cards).toHaveLength(3);

    const expectedDatasources: DatasourceCard[] = [
      {
        name: 'S3GLUE',
        displayName: 'Amazon S3',
        description: 'Connect to Amazon S3 via AWS Glue Data Catalog',
        displayIcon: (
          <EuiIcon type={'../direct_query_data_sources_components/icons/s3_logo.svg'} size="xl" />
        ),
        onClick: expect.any(Function),
      },
      {
        name: 'PROMETHEUS',
        displayName: 'Prometheus',
        description: 'Connect to Prometheus',
        displayIcon: (
          <EuiIcon
            type={'../direct_query_data_sources_components/icons/prometheus_logo.svg'}
            size="xl"
          />
        ),
        onClick: expect.any(Function),
      },
      {
        name: 'OPENSEARCH',
        displayName: 'OpenSearch',
        description: 'Connect to OpenSearch',
        displayIcon: (
          <EuiIcon
            type={'../direct_query_data_sources_components/icons/opensearch_logo.svg'}
            size="xl"
          />
        ),
        onClick: expect.any(Function),
      },
    ];

    expectedDatasources.forEach((datasource, index) => {
      const card = cards.at(index);
      expect(card.prop('title')).toEqual(datasource.displayName);
      expect(card.prop('description')).toEqual(datasource.description);
      expect(card.prop('icon')?.type).toEqual(datasource.displayIcon?.type);
    });
  });

  test('does not render OpenSearch card when featureFlagStatus is false', () => {
    const wrapper = shallowComponent({ ...defaultProps, featureFlagStatus: false });
    const cards = wrapper.find(EuiCard);

    expect(cards).toHaveLength(2);
    expect(cards.someWhere((card) => card.prop('title') === 'OpenSearch')).toBe(false);
  });

  test('handles card click events', () => {
    const pushSpy = jest.spyOn(history, 'push');
    const wrapper = shallowComponent();

    const s3Card = wrapper.find('[data-test-subj="datasource_card_s3glue"]');
    const prometheusCard = wrapper.find('[data-test-subj="datasource_card_prometheus"]');
    const opensearchCard = wrapper.find('[data-test-subj="datasource_card_opensearch"]');

    s3Card.simulate('click');
    expect(pushSpy).toHaveBeenCalledWith(`/configure/${AMAZON_S3_URL}`);

    prometheusCard.simulate('click');
    expect(pushSpy).toHaveBeenCalledWith(`/configure/${PROMETHEUS_URL}`);

    if (defaultProps.featureFlagStatus) {
      opensearchCard.simulate('click');
      expect(pushSpy).toHaveBeenCalledWith(`/configure/${OPENSEARCH_URL}`);
    }
  });
});
