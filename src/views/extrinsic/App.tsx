import * as React from "react";
// import { Extrinsic } from '@polkadot/react-components';

class App extends React.Component {
  public render() {
    return (
      <div>
        <p>Hello world!</p>
        <p>Some data: {(window as any).data}</p>
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
