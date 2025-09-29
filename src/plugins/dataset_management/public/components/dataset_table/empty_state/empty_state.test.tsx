/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EmptyState } from '../empty_state';
import { shallow } from 'enzyme';
import sinon from 'sinon';
// @ts-expect-error TS2306 TODO(ts-error): fixme
import { findTestSubject } from '@elastic/eui/lib/test';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { docLinksServiceMock } from '../../../../../../core/public/mocks';
import { MlCardState } from '../../../types';

const docLinks = docLinksServiceMock.createStartContract();

jest.mock('react-router-dom', () => ({
  useHistory: () => ({
    createHref: jest.fn(),
  }),
}));

describe('EmptyState', () => {
  it('should render normally', () => {
    const component = shallow(
      <EmptyState
        docLinks={docLinks}
        onRefresh={() => {}}
        navigateToApp={async () => {}}
        getMlCardState={() => MlCardState.ENABLED}
        canSave={true}
      />
    );

    expect(component).toMatchSnapshot();
  });

  describe('props', () => {
    describe('onRefresh', () => {
      it('is called when refresh button is clicked', () => {
        const onRefreshHandler = sinon.stub();

        const component = mountWithIntl(
          <EmptyState
            docLinks={docLinks}
            onRefresh={onRefreshHandler}
            navigateToApp={async () => {}}
            getMlCardState={() => MlCardState.ENABLED}
            canSave={true}
          />
        );

        findTestSubject(component, 'refreshIndicesButton').simulate('click');

        sinon.assert.calledOnce(onRefreshHandler);
      });
    });
  });
});
