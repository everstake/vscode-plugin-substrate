import React, { useEffect, useState } from 'react';

const NodeInfo = (props: any) => {
  const {api} = props;
  const [nodeInfo, setNodeInfo] = useState({} as { chain: string; nodeName: string; nodeVersion: string; });

  useEffect(() => {
    const getInfo = () => {
      Promise.all([
        api.rpc.system.chain(),
        api.rpc.system.name(),
        api.rpc.system.version(),
      ])
        .then(([chain, nodeName, nodeVersion]) => {
          setNodeInfo({
            chain,
            nodeName,
            nodeVersion
          });
        })
        .catch((e) => console.error(e));
    };
    getInfo();
  }, [api.rpc.system]);

  return (
    <>
      {nodeInfo.chain} - {nodeInfo.nodeName} (v{nodeInfo.nodeVersion})
      <hr/>
    </>
  );
};

export default NodeInfo;
