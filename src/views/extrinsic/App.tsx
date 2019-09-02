import React from "react";
import Identicon from '@polkadot/react-identicon';

class App extends React.Component {
  public render() {
    const data = (window as any).data;
    return (
      <div>
        <h1>Hello there!</h1>
        <p>Some test data: {JSON.stringify(data)}</p>
        <Identicon
          value="5GeJHN5EcUGPoa5pUwYkXjymoDVN1DJHsBR4UGX4XRAwK1Ez"
          size={32}
          theme="polkadot"
        />
      </div>
    );
  }
}

export default App;
