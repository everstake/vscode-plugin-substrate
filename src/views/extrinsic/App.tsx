import * as React from "react";
// import { Extrinsic } from '@polkadot/react-components';

class App extends React.Component {
  public render() {
    const data = (window as any).data;
    return (
      <div>
        <h1>Hello there!</h1>
        <p>Some test data: {JSON.stringify(data)}</p>
        {/* <Extrinsic
          defaultValue={console.log}
          label={'submit the following extrinsic'}
          onChange={console.log}
          onEnter={console.log}
        /> */}
      </div>
    );
  }
}

export default App;
