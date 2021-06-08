/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// @ts-ignore
import d3TagCloud from 'd3-cloud';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';

import { ScreenReaderSummary } from '../../../../components/accessibility';
import { SettingsSpec, WordCloudElementEvent } from '../../../../specs/settings';
import { onChartRendered } from '../../../../state/actions/chart';
import { GlobalChartState } from '../../../../state/chart_state';
import {
  A11ySettings,
  DEFAULT_A11Y_SETTINGS,
  getA11ySettingsSelector,
} from '../../../../state/selectors/get_accessibility_config';
import { getInternalIsInitializedSelector, InitStatus } from '../../../../state/selectors/get_internal_is_intialized';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { Dimensions } from '../../../../utils/dimensions';
import { Configs, Datum, nullShapeViewModel, ShapeViewModel, Word } from '../../layout/types/viewmodel_types';
import { geometries } from '../../state/selectors/geometries';

function seed() {
  return 0.5;
}

function getFont(d: Word) {
  return d.fontFamily;
}

function getFontStyle(d: Word) {
  return d.style;
}

function getFontWeight(d: Word) {
  return d.fontWeight;
}

function getWidth(conf: Configs) {
  return conf.width ?? 500;
}

function getHeight(conf: Configs) {
  return conf.height ?? 500;
}

function getFontSize(d: Word) {
  return d.size;
}

function hashWithinRange(str: string, max: number) {
  str = JSON.stringify(str);
  let hash = 0;
  for (const ch of str) {
    hash = (hash * 31 + ch.charCodeAt(0)) % max;
  }
  return Math.abs(hash) % max;
}

function getRotation(startAngle: number, endAngle: number, count: number, text: string) {
  const angleRange = endAngle - startAngle;
  const angleCount = count ?? 360;
  const interval = count - 1;
  const angleStep = interval === 0 ? 0 : angleRange / interval;
  const index = hashWithinRange(text, angleCount);
  return index * angleStep + startAngle;
}

function exponential(minFontSize: number, maxFontSize: number, exponent: number, weight: number) {
  return minFontSize + (maxFontSize - minFontSize) * weight ** exponent;
}

function linear(minFontSize: number, maxFontSize: number, _exponent: number, weight: number) {
  return minFontSize + (maxFontSize - minFontSize) * weight;
}

function squareRoot(minFontSize: number, maxFontSize: number, _exponent: number, weight: number) {
  return minFontSize + (maxFontSize - minFontSize) * Math.sqrt(weight);
}

function log(minFontSize: number, maxFontSize: number, _exponent: number, weight: number) {
  return minFontSize + (maxFontSize - minFontSize) * Math.log2(weight + 1);
}

const weightFnLookup = { linear, exponential, log, squareRoot };

function layoutMaker(config: Configs, data: Datum[]) {
  const words = data.map((d) => {
    const weightFn = weightFnLookup[config.weightFn];
    return {
      datum: d,
      text: d.text,
      color: d.color,
      fontFamily: config.fontFamily,
      style: config.fontStyle,
      fontWeight: config.fontWeight,
      size: weightFn(config.minFontSize, config.maxFontSize, config.exponent, d.weight),
    };
  });
  return d3TagCloud()
    .random(seed)
    .size([getWidth(config), getHeight(config)])
    .words(words)
    .spiral(config.spiral ?? 'archimedean')
    .padding(config.padding ?? 5)
    .rotate((d: Word) => getRotation(config.startAngle, config.endAngle, config.count, d.text))
    .font(getFont)
    .fontStyle(getFontStyle)
    .fontWeight(getFontWeight)
    .fontSize((d: Word) => getFontSize(d));
}

const View = ({
  words,
  conf,
  actions: { onElementClick, onElementOver, onElementOut },
  specId,
}: {
  words: Word[];
  conf: Configs;
  actions: {
    onElementClick?: SettingsSpec['onElementClick'];
    onElementOver?: SettingsSpec['onElementOver'];
    onElementOut?: SettingsSpec['onElementOut'];
  };
  specId: string;
}) => {
  return (
    <svg width={getWidth(conf)} height={getHeight(conf)} role="presentation">
      <g transform={`translate(${getWidth(conf) / 2}, ${getHeight(conf) / 2})`}>
        {words.map((d, i) => {
          const elements: WordCloudElementEvent[] = [[d.datum, { specId, key: specId }]];
          const actions = {
            ...(onElementClick && {
              onClick: () => {
                onElementClick(elements);
              },
            }),
            ...(onElementOver && {
              onMouseOver: () => {
                onElementOver(elements);
              },
            }),
            ...(onElementOut && {
              onMouseOut: () => {
                onElementOut();
              },
            }),
          };
          return (
            <text
              key={String(i)}
              style={{
                fontSize: getFontSize(d),
                fontStyle: getFontStyle(d),
                fontFamily: getFont(d),
                fontWeight: getFontWeight(d),
                fill: d.color,
              }}
              textAnchor="middle"
              transform={`translate(${d.x}, ${d.y}) rotate(${d.rotate})`}
              {...actions}
            >
              {d.text}
            </text>
          );
        })}
      </g>
    </svg>
  );
};

interface ReactiveChartStateProps {
  initialized: boolean;
  geometries: ShapeViewModel;
  chartContainerDimensions: Dimensions;
  a11ySettings: A11ySettings;
  onElementClick?: SettingsSpec['onElementClick'];
  onElementOver?: SettingsSpec['onElementOver'];
  onElementOut?: SettingsSpec['onElementOut'];
}

interface ReactiveChartDispatchProps {
  onChartRendered: typeof onChartRendered;
}

type Props = ReactiveChartStateProps & ReactiveChartDispatchProps;

class Component extends React.Component<Props> {
  static displayName = 'Wordcloud';

  componentDidMount() {
    if (this.props.initialized) {
      this.props.onChartRendered();
    }
  }

  componentDidUpdate() {
    if (this.props.initialized) {
      this.props.onChartRendered();
    }
  }

  render() {
    const {
      initialized,
      chartContainerDimensions: { width, height },
      geometries: { wordcloudViewModel, specId },
      a11ySettings,
      onElementClick,
      onElementOver,
      onElementOut,
    } = this.props;
    if (!initialized || width === 0 || height === 0) {
      return null;
    }
    const conf1: Configs = {
      width,
      height,
      startAngle: wordcloudViewModel.startAngle,
      endAngle: wordcloudViewModel.endAngle,
      count: wordcloudViewModel.angleCount,
      padding: wordcloudViewModel.padding,
      fontWeight: wordcloudViewModel.fontWeight,
      fontFamily: wordcloudViewModel.fontFamily,
      fontStyle: wordcloudViewModel.fontStyle,
      minFontSize: wordcloudViewModel.minFontSize,
      maxFontSize: wordcloudViewModel.maxFontSize,
      spiral: wordcloudViewModel.spiral,
      exponent: wordcloudViewModel.exponent,
      weightFn: wordcloudViewModel.weightFn,
    };

    const layout = layoutMaker(conf1, wordcloudViewModel.data);

    let ww;
    layout.on('end', (w: Word[]) => (ww = w)).start();

    const wordCount = wordcloudViewModel.data.length;
    const renderedWordObjects = (ww as unknown) as Word[];
    const renderedWordCount: number = renderedWordObjects.length;
    const notAllWordsFit = wordCount !== renderedWordCount;
    if (notAllWordsFit && wordcloudViewModel.outOfRoomCallback instanceof Function) {
      wordcloudViewModel.outOfRoomCallback(
        wordCount,
        renderedWordCount,
        renderedWordObjects.map((word) => word.text),
      );
    }

    return (
      <figure aria-labelledby={a11ySettings.labelId} aria-describedby={a11ySettings.descriptionId}>
        <View
          words={renderedWordObjects}
          conf={conf1}
          actions={{ onElementClick, onElementOut, onElementOver }}
          specId={specId}
        />
        <ScreenReaderSummary />
      </figure>
    );
  }
}

const mapDispatchToProps = (dispatch: Dispatch): ReactiveChartDispatchProps =>
  bindActionCreators(
    {
      onChartRendered,
    },
    dispatch,
  );

const DEFAULT_PROPS: ReactiveChartStateProps = {
  initialized: false,
  geometries: nullShapeViewModel(),
  chartContainerDimensions: {
    width: 0,
    height: 0,
    left: 0,
    top: 0,
  },
  a11ySettings: DEFAULT_A11Y_SETTINGS,
};

const mapStateToProps = (state: GlobalChartState): ReactiveChartStateProps => {
  if (getInternalIsInitializedSelector(state) !== InitStatus.Initialized) {
    return DEFAULT_PROPS;
  }
  return {
    initialized: true,
    geometries: geometries(state),
    chartContainerDimensions: state.parentDimensions,
    a11ySettings: getA11ySettingsSelector(state),
    onElementClick: getSettingsSpecSelector(state).onElementClick,
    onElementOver: getSettingsSpecSelector(state).onElementOver,
    onElementOut: getSettingsSpecSelector(state).onElementOut,
  };
};

/** @internal */
export const Wordcloud = connect(mapStateToProps, mapDispatchToProps)(Component);
