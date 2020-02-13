import React, { useEffect } from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect } from 'react-redux';
import { specParsing, specParsed, specUnmounted } from '../state/actions/specs';

export const SpecsParserComponent: React.FunctionComponent<{}> = (props) => {
  const injected = props as DispatchProps;
  injected.specParsing();
  useEffect(() => {
    injected.specParsed();
  });
  useEffect(
    () => () => {
      injected.specUnmounted();
    },
    [],
  );
  return props.children ? (props.children as React.ReactElement) : null;
};

interface DispatchProps {
  specParsing: () => void;
  specParsed: () => void;
  specUnmounted: () => void;
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps =>
  bindActionCreators(
    {
      specParsing,
      specParsed,
      specUnmounted,
    },
    dispatch,
  );

export const SpecsParser = connect(null, mapDispatchToProps)(SpecsParserComponent);
