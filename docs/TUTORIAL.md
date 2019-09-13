<h1 align="center">Plugin Tutorial</h1>

With this file, you will learn how to use this plugin and the main features of it.

## Prerequisites

To start using this extension - install it from [marketplace](). It will install [substrate](https://www.parity.io/substrate/) if it's not yet installed.

## Features

This extension provides the next features:

1. __Manage nodes and connections__
   1. [Add node](#add-node)
   2. [Start local node](#start-local-node)
   3. [Stop local node](#stop-local-node)
   4. [Clear chain data](#clear-chain-data)
   5. [Edit types](#edit-types)
   6. [Connect to node](#connect-to-node)
   7. [Edit node](#edit-node)
   8. [Remove node](#remove-node)
   9. [Configure devcontainer](#configure-devcontainer)
   10. [Reopen in container](#reopen-in-container)
   11. [Disconnect from node](#disconnect-from-node)
2. __Manage accounts__
   1. [Add account](#add-account)
   2. [Create account](#create-account)
   3. [Import account](#import-account)
   4. [Change name of account](#change-name-of-account)
   5. [Copy address of account](#copy-address-of-account)
   6. [Export account](#export-account)
   7. [Remove account](#remove-account)
3. __Execute extrinsics__
   1. [Execute extrinsic](#execute-extrinsic)
   2. [Show webview with extrinsics](#show-webview-with-extrinsics)
4. __Subscribe to storage__
   1. [Subscribe to chain data](#subscribe-to-chain-data)

## How to use

Click on the icon of `Substrate` in the sidebar menu. If there no icon - RMB click on the sidebar and select show plugin.

## Commands

List of all available commands of the plugin:

### Add node <sup><sub> [#panel-navigation](#tags)

That command will add node to the plugin storage, after that you will be able to connect to it and execute extrinsics and subscribe for data.

### Start local node <sup><sub> [#directory-with-substrate-project](#tags)

That command will run script in VSCode terminal (in local directory) to start local node in development mode.

### Stop local node <sup><sub> [#directory-with-substrate-project](#tags)

That command will stop local node and close the VSCode terminal. If no running terminal with node - it will ignore the execution of the command.

### Clear chain data <sup><sub> [#directory-with-substrate-project](#tags)

That command will run the `purge-chain` script in VSCode terminal. If no running terminal - it will ignore the execution of the command.

### Edit types <sup><sub> [#panel-navigation](#tags)

That command will open for editing the file with global `@polkadot/api` types. For now, it's the single available opportunity to connect to nodes with custom types.

### Connect to node <sup><sub> [#panel-item](#tags)

That command will connect to the node with provided url and show all available extrinsics and storage states.

### Edit node <sup><sub> [#panel-item](#tags)

That command will edit the node's name and url.

### Remove node <sup><sub> [#panel-item](#tags)

That command will remove the node from plugin storage.

### Configure devcontainer <sup><sub> [#panel-navigation](#tags)

That command will create .devcontainer directory in the root of the workspace and add `devcontainer.json` with `Dockerfile` files for the container development.

### Reopen in container <sup><sub> [#panel-navigation](#tags)

That command will call `Reopen in Container` command from `Remote-Containers` extension.

### Disconnect from node <sup><sub> [#panel-navigation](#tags)

That command will disconnect from the node.

### Add account <sup><sub> [#panel-navigation](#tags)

That command will add a new account with key and seed provided by user.

### Create account <sup><sub> [#panel-navigation](#tags)

That command will create a new account. It will automatically generate raw seed or mnemonic seed (depending on user choice) and ask password to encrypt account keyring.

### Import account <sup><sub> [#panel-navigation](#tags)

That command will import an account from `.json` file.

### Change name of account <sup><sub> [#panel-item](#tags)

That command will change the name of the account in plugin storage. Name is stored in metadata of keyring.

### Copy address of account <sup><sub> [#panel-item](#tags)

That command will copy the address of the account to clipboard.

### Export account <sup><sub> [#panel-item](#tags)

That command will export the account to a file according to the path entered by the user.

### Remove account <sup><sub> [#panel-item](#tags)

That command will remove the account from plugin storage.

### Execute extrinsic <sup><sub> [#panel-item](#tags)

That command will execute and sign the extrinsic with provided arguments and account key.

### Show webview with extrinsics <sup><sub> [#panel-navigation](#tags)

That command will show the webview in new document with all available extrinsics of active node.

### Subscribe to chain data <sup><sub> [#panel-item](#tags)

That command will show the webview in new document with automatically updated data from the substrate storage.

## Tags

Here is a list of tags with their descriptions/meanings:

`#directory-with-substrate-project` - you need to be in a directory with substrate project to execute the command.

`#panel-navigation` - you can find the command on the panel's navigation.

`#panel-item` - to run the command you have to right mouse click at the item on the corresponding panel.
