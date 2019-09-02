import React, { useState, useEffect, Fragment } from 'react';
import { Spin, Row } from 'antd';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { string } from 'prop-types';
// import Identicon from '@polkadot/react-identicon';

const WS_PROVIDER = 'wss://poc3-rpc.polkadot.io/';

const NodeInfo = (props: any) => {
  const {api} = props;
  const [nodeInfo, setNodeInfo] = useState({} as { chain: string; nodeName: string; nodeVersion: string; })

  useEffect(() => {
    const getInfo = () => {
      Promise.all([
        api.rpc.system.chain(),
        api.rpc.system.name(),
        api.rpc.system.version(),
      ])
      .then(([chain, nodeName, nodeVersion]) => {
        setNodeInfo ({
          chain,
          nodeName,
          nodeVersion
        })
      })
      .catch((e) => console.error(e));
    }
    getInfo()
  },[api.rpc.system]);
  
  return (
    <Fragment>
      {nodeInfo.chain} - {nodeInfo.nodeName} (v{nodeInfo.nodeVersion})
      <hr/>
    </Fragment>
  )
}


const App = () => {
  const [api, setApi] = useState();
  const [apiReady, setApiReady] = useState();
  // const WS_PROVIDER = 'ws://127.0.0.1:9944';


  useEffect(() => {
    createApi();
  }, []);

  const createApi = async () => {
    const provider = new WsProvider(WS_PROVIDER);
    try {
      const api = await ApiPromise.create({provider});
      setApi(api);
      setApiReady(true);
    } catch (e) {
      console.error(e)
    }
  }

  if(!apiReady){
    return <Spin tip="Connecting to the blockchain" />;
  }

  return (
    <div style={{ color: "#fff" }}>
      <NodeInfo
        api={api}
      />
      Connected
    </div>
  );
}

// class App extends React.Component {
//   public render() {
//     const data = (window as any).data;
//     return (
//       <div>
//         <h1>Hello there!</h1>
//         <p>Some test data: {JSON.stringify(data)}</p>
//         <Identicon
//           value="5GeJHN5EcUGPoa5pUwYkXjymoDVN1DJHsBR4UGX4XRAwK1Ez"
//           size={32}
//           theme="polkadot"
//         />
//       </div>
//     );
//   }
// }

export default App;
