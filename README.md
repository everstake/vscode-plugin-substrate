<h2 align="center">VSCode Plugin for Substrate</h2>

This plugin provides a convenient development environment for Parity Substrate framework.

## Prerequisites

To start using this extension - install it from [marketplace](). To run this extension you need following pre-requirements:

1) Visual Studio Code v1.37.0+
2) Yarn v1.13.0+

## How to run

Steps:

1) Clone project and open it in VSCode.
2) Execute command `yarn` and `yarn compile` in terminal.
3) Press `F5`.

## To start webview development:

1) Execute the command `yarn watch:views`.
2) Press `F5`.
3) Press `CMD + SHIFT + P` and type `Show webview`.
4) Make changes to webview in `./src/views`.

## Features

This extension provides the next features:

1) Start/Stop a local node.
2) Clear chain data.
3) Manage accounts.
4) Execute extrinsics.
5) Subscribe for chain state changes.

## How to use

Navigate to `Substrate` plugin in sidebar menu.

### Nodes:

You need to be in a directory with substrate project to execute the next commands:

1) Start: In 'Nodes' section click at the '...' and 'Start local node'.
2) Stop: You need to have an open terminal with node running - in 'Nodes' section click at the '...' and 'Stop local node'.
3) Clear: In 'Nodes' section click at the '...' and 'Clear chain data'.

To run next commands you don't need to be in a directory with substrate project.

1) Connect: In 'Nodes' section RMB click at the node and then click 'Connect...'.
2) Remove: In 'Nodes' section RMB click at the node and then click 'Remove...'.
3) Edit node: In 'Nodes' section RMB click at the node and then click 'Edit node...'.
4) Edit types: In 'Nodes' section click at the '...' and 'Edit types' - type your custom substrate storage types.

### Accounts:

1) Add: In 'Accounts' section click at the '+' and type account name, account encryption type, Mnemonic/Seed/Uri.
2) Change name: In 'Accounts' section RMB click at the account and then click 'Change name...'.
3) Remove: In 'Accounts' section RMB click at the account and then click 'Remove...'.
4) Import: In 'Accounts' section click at the '...' and choose a file with exported account.
5) Export: In 'Accounts' section RMB click at the account and then click 'Export account...'.
6) Copy address: In 'Accounts' section RMB click at the account and then click 'Copy address...'.

### Extrinsics:

1) Run extrinsic: In 'Extrinsics' section click at the module and choose extrinsic to execute.
Then type all arguments and account which will sign extrinsic.

### Chain state:

1) Substrate: In 'Chain state' section click at the module and choose a state to subscribe and type key argument (if it's a map).

## Plugin 



## License

This project is licensed under the Apache-2.0 License - see the [LICENSE](LICENSE) file for details.
