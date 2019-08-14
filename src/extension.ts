import * as vscode from 'vscode';
import to from 'await-to-js';
import { ApiPromise, WsProvider } from '@polkadot/api';

import { TreeViewProvider } from './tree';
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
	const treeViewProvider = new TreeViewProvider(substrate);
	vscode.window.registerTreeDataProvider('extrinsics', treeViewProvider);
	vscode.commands.registerCommand('pluginPolkadot.startNode', substrate.startNode.bind(substrate));
	vscode.commands.registerCommand('pluginPolkadot.stopNode', substrate.stopNode.bind(substrate));
	vscode.commands.registerCommand('pluginPolkadot.clearChainData', substrate.clearChainData.bind(substrate));
	vscode.commands.registerCommand('pluginPolkadot.runExtrinsic', (item) => {
		console.log(item);
        vscode.window.showInputBox({
            placeHolder: 'Great',
            prompt: `Executing extrinsic ${item.label}`,
        }).then((value?: string) => {
            console.log("TCL: Substrate -> stopNode -> value", value);
        });
	});

	substrate.setup();
}

export async function deactivate() {
	vscode.window.showInformationMessage('Thanks for a great time together');
}
