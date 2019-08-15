import * as vscode from 'vscode';
import to from 'await-to-js';
import { ApiPromise, WsProvider } from '@polkadot/api';

import { ExtrinsicsTreeView, AccountsTreeView, StatesTreeView } from './tree';
import { Substrate } from './substrate';

export async function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, extension "plugin-polkadot" is now active!');

	// Todo: Get address from configuration
	// Todo: Fix error on determine types
	const provider = new WsProvider('ws://127.0.0.1:9944');
	const [err, api] = await to(ApiPromise.create({ provider }));
	if (err || api === undefined) {
		console.log('Fatal: ', err.message);
		return;
	}

 	const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
	const substrate = new Substrate(statusBar, vscode.workspace.rootPath || './', api);

	const extrinsicsTreeView = new ExtrinsicsTreeView(substrate);
	vscode.window.registerTreeDataProvider('extrinsics', extrinsicsTreeView);

	const statesTreeView = new StatesTreeView(substrate);
	vscode.window.registerTreeDataProvider('states', statesTreeView);

	const accountsTreeView = new AccountsTreeView(substrate);
	vscode.window.registerTreeDataProvider('accounts', accountsTreeView);

	vscode.commands.registerCommand('nodes.startNode', substrate.startNode.bind(substrate));
	vscode.commands.registerCommand('nodes.stopNode', substrate.stopNode.bind(substrate));
	vscode.commands.registerCommand('nodes.clearChainData', substrate.clearChainData.bind(substrate));
	vscode.commands.registerCommand('nodes.runExtrinsic', substrate.runExtrinsic.bind(substrate));
	vscode.commands.registerCommand('accounts.addAccount', () => {});
	vscode.commands.registerCommand('accounts.removeAccount', () => {});

	substrate.setup();
}

export async function deactivate() {
	vscode.window.showInformationMessage('Thanks for a great time together');
}
