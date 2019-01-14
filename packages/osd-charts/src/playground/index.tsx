import { EuiButton, EuiFlexGrid, EuiFlexItem, EuiSwitch } from '@elastic/eui';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import {
  AreaSeries,
  Axis,
  BarSeries,
  Chart,
  getAxisId,
  getGroupId,
  getSpecId,
  Position,
  Rotation,
  ScaleType,
  Settings,
} from '../';
import * as TestDatasets from '../lib/series/utils/test_dataset';
import { DataGenerator } from '../utils/data_generators/data_generator';
import {
  randomizeData,
  uniformRandomizer,
} from '../utils/data_generators/randomizers';
import './playground.scss';

const dataGenerator = new DataGenerator();
class App extends Component {
  state = {
    debug: false,
    randomData: TestDatasets.BARCHART_2Y2G,
    highVolume: dataGenerator.generateGroupedSeries(10, 2),
  };
  onChangeData = () => {
    this.setState({
      randomData: randomizeData(
        TestDatasets.BARCHART_2Y2G,
        ['y1', 'y2'],
        uniformRandomizer(1000),
      ),
      highVolume: dataGenerator.generateGroupedSeries(10, 2),
    });
  }
  onSwitchDebug = () => {
    this.setState({ debug: !this.state.debug });
  }
  renderingTest = (
    renderer: 'svg' | 'canvas' = 'svg',
    rotation: Rotation = 0,
    showLegend: boolean = true,
    legendPosition: Position,
  ) => {
    return (
      <div className="app">
        <div className="header">
          <EuiFlexGrid
          // justifyContent="flex-end"
          // alignItems="center"
          >
            <EuiFlexItem>
              <EuiButton onClick={this.onChangeData}>Update chart</EuiButton>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiSwitch
                name="debug"
                label="debug"
                checked={this.state.debug}
                onChange={this.onSwitchDebug}
              />
            </EuiFlexItem>
          </EuiFlexGrid>
        </div>
        <div className="chartContainers">
          <div
            className="chartContainer"
            key={`renderTest-${renderer}-${rotation}`}
          >
            <Chart renderer={renderer}>
              <Settings
                rotation={rotation}
                animateData={true}
                showLegend={showLegend}
                legendPosition={legendPosition}
                debug={this.state.debug}
              />
              <Axis
                id={getAxisId('bottom2')}
                position={Position.Bottom}
                title={'Rendering basic test'}
                showOverlappingTicks={true}
              />
              <Axis
                id={getAxisId('left2')}
                title={'count'}
                position={Position.Left}
                tickFormat={(d) => Number(d).toFixed(2)}
              />

              <BarSeries
                id={getSpecId('lines')}
                xScaleType={ScaleType.Linear}
                yScaleType={ScaleType.Linear}
                xAccessor="x"
                yAccessors={['y1', 'y2']}
                splitSeriesAccessors={['g1', 'g2']}
                stackAccessors={['x']}
                // curve={CurveType.CURVE_BASIS}
                data={this.state.randomData}
                yScaleToDataExtent={false}
              />
              <AreaSeries
                groupId={getGroupId('group2')}
                id={getSpecId('areas')}
                xScaleType={ScaleType.Ordinal}
                yScaleType={ScaleType.Linear}
                xAccessor="x"
                yAccessors={['y1', 'y2']}
                splitSeriesAccessors={['g1', 'g2']}
                stackAccessors={['x', 'g']}
                data={this.state.randomData}
                // curve={CurveType.CURVE_MONOTONE_X}
                yScaleToDataExtent={false}
              />
              {/* <BarSeries
              groupId={getGroupId('group3')}
              id={getSpecId('bars')}
              xScaleType={ScaleType.Linear}
              yScaleType={ScaleType.Linear}
              xAccessor="x"
              yAccessors={['y1', 'y2']}
              stackAccessors={['x']}
              data={TestDatasets.BARCHART_2Y0G}
              // yScaleToDataExtent={false}
            /> */}
            </Chart>
          </div>
        </div>
      </div>
    );
  }
  render() {
    return (
      <div className="app">
        <div className="chartContainers">
          {/* { this.renderingTest('canvas', 0, false, Position.Bottom)} */}
          {this.renderingTest('canvas', 0, true, Position.Right)}
          {this.renderingTest('canvas', 0, true, Position.Left)}
          {this.renderingTest('canvas', 0, true, Position.Top)}
          {this.renderingTest('canvas', 0, true, Position.Bottom)}
        </div>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
