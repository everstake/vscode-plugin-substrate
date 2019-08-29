# Plugin for Polkadot

This plugin provides convinient development environment for Parity Substrate framework.

## How to run

To start using this extension - install it from [marketplace](). To run this extension you need following pre-requirements:

1) Visual Studio Code v1.35.0+
2) Yarn v1.13.0+

Steps:

1) Clone project and open in VSCode
2) Execute command `yarn` in terminal
3) Press `F5`

## Features

This extension provides next features:

1) Start/Stop local node
2) Clear chain data
3) Manage accounts
4) Execute extrinsics
5) Subscribe for chain state changes

## How to use

Navigate to `Substrate` plugin in sidebar menu.

### Nodes:

You need to be in directory with substrate project to execute next commands:

1) Start: In 'Nodes' section click at the '...' and 'Start local node'.
2) Stop: You need to have an open terminal with node running - in 'Nodes' section click at the '...' and 'Stop local node'.
3) Clear: In 'Nodes' section click at the '...' and 'Clear chain data'.

To remove or connect to a node you don't need to be in directory with substrate.

1) Connect: In 'Nodes' section RMB click at node and then click 'Connect...'.
2) Remove: In 'Nodes' section RMB click at node and then click 'Remove...'.

### Accounts:

1) Add: In 'Accounts' section click at the '+' and type account name, account encryption type, Menemonic/Seed/Uri.
2) Change name: In 'Accounts' section RMB click at account and then click 'Change name...'.
3) Remove: In 'Accounts' section RMB click at account and then click 'Remove...'.
4) Import: In 'Accounts' section click at the '...' and choose file with exported account.

### Extrinsics:

1) Run extrinsic: In 'Extrinsics' section click at module and choose extrinsic to execute.
Then type all arguments and account which will sign extrinsic.

### Chain state:

1) Substrate: In 'Chain state' section click at module and choose state to subscribe and type key argument (if it's map).

## License

This project is licensed under the Apache-2.0 License - see the [LICENSE](LICENSE) file for details.
