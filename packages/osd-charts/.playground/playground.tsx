import React from 'react';
import { Chart, Datum, Partition } from '../src';
export class Playground extends React.Component<{}, { isSunburstShown: boolean }> {
  chartRef: React.RefObject<Chart> = React.createRef();
  state = {
    isSunburstShown: true,
  };

  render() {
    return (
      <>
        <div className="chart">
          <Chart ref={this.chartRef}>
            <Partition
              id={'piechart'}
              data={[
                { id: 'Item\u00A00', g: 'A', v: 30 },
                { id: 'Item\u00A01', g: 'A', v: 20 },
                { id: 'Item\u00A02', g: 'B', v: 50 },
              ]}
              valueAccessor={(d: Datum) => d.v}
              valueFormatter={(d: Datum) => `${d}%`}
              layers={[
                { groupByRollup: (d: Datum) => d.g, nodeLabel: (d: Datum) => `Group ${d}` },
                {
                  groupByRollup: (d: Datum) => d.id,
                  nodeLabel: (d: Datum) => d,
                  fillLabel: { valueFormatter: (d: Datum) => `${d} pct` },
                },
              ]}
            />
          </Chart>
        </div>
        <div className="chart">
          <Chart ref={this.chartRef}>
            <Partition
              id={'piechart'}
              data={[30, 20, 50]}
              valueFormatter={(d: Datum) => `${d}%`}
              layers={[
                {
                  groupByRollup: (d: Datum, i: number) => (i < 2 ? 'A' : 'B'),
                  nodeLabel: (d: Datum) => `Group ${d}`,
                },
                { groupByRollup: (d: Datum, i: number) => i, nodeLabel: (d: Datum) => `Item\u00A0${d}` },
              ]}
            />
          </Chart>
        </div>
      </>
    );
  }
}
