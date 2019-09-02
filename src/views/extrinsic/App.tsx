import React, { useState, useEffect } from 'react';
import { Spin, Row } from 'antd';
import { ApiPromise, WsProvider } from '@polkadot/api';
import keyring from '@polkadot/ui-keyring';
import NodeInfo from "./components/NodeInfo";
import Balances from "./components/Balances";

const WS_PROVIDER = 'wss://poc3-rpc.polkadot.io/';


const App = () => {
  const [api, setApi] = useState();
  const [apiReady, setApiReady] = useState();

  useEffect(() => {
    createApi();

    keyring.loadAll({
      isDevelopment: true
    });
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
       <Balances
        keyring={keyring}
        api={api}
      />
      Connected
    </div>
  );
};

export default App;
