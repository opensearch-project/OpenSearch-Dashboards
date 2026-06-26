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

import classNames from 'classnames';
import React from 'react';

import { EuiLoadingChart } from '@elastic/eui';
import { Subscription } from 'rxjs';
import { ErrorEmbeddable, IEmbeddable } from '../embeddables';
import { IContainer } from './i_container';
import { EmbeddableStart } from '../../plugin';

export interface EmbeddableChildPanelProps {
  embeddableId: string;
  className?: string;
  container: IContainer;
  PanelComponent: EmbeddableStart['EmbeddablePanel'];
}

interface State {
  loading: boolean;
  visible: boolean;
}

/**
 * This component can be used by embeddable containers using react to easily render children. It waits
 * for the child to be initialized, showing a loading indicator until that is complete.
 * Panels that are not in the viewport will defer mounting the PanelComponent until they scroll into view.
 */

export class EmbeddableChildPanel extends React.Component<EmbeddableChildPanelProps, State> {
  [panel: string]: any;
  public mounted: boolean;
  public embeddable!: IEmbeddable | ErrorEmbeddable;
  private subscription?: Subscription;
  private panelRef = React.createRef<HTMLDivElement>();
  private observer?: IntersectionObserver;

  constructor(props: EmbeddableChildPanelProps) {
    super(props);
    this.state = {
      loading: true,
      visible: false,
    };

    this.mounted = false;
  }

  public async componentDidMount() {
    const el = this.panelRef.current;
    if (el) {
      this.observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && this.mounted) {
            this.observer?.disconnect();
            this.setState({ visible: true });
          }
        },
        { rootMargin: '200px' }
      );
      this.observer.observe(el);
    }

    this.mounted = true;
    const { container } = this.props;

    this.embeddable = await container.untilEmbeddableLoaded(this.props.embeddableId);
    if (this.mounted) {
      this.setState({ loading: false });
    }
  }

  public componentWillUnmount() {
    this.mounted = false;
    this.observer?.disconnect();
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  public render() {
    const { PanelComponent } = this.props;
    const classes = classNames('embPanel', {
      'embPanel-isLoading': this.state.loading || !this.state.visible,
    });

    return (
      <div className={classes} ref={this.panelRef}>
        {this.state.loading || !this.embeddable || !this.state.visible ? (
          <EuiLoadingChart size="l" mono />
        ) : (
          <PanelComponent embeddable={this.embeddable} />
        )}
      </div>
    );
  }
}
