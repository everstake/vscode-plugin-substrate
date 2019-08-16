import 'module-alias/register';
import * as vscode from 'vscode';
import to from 'await-to-js';
import { ApiPromise, WsProvider } from '@polkadot/api';

import * as commands from '@/commands';
import * as treeViews from '@/trees';
import { Substrate } from '@/substrate';

export async function activate(context: vscode.ExtensionContext) {
	// Todo: Move to add node and get rid of this
	// Todo: Get address from nodes in context's global storage
	// Todo: Fix error on determine types
	const provider = new WsProvider('ws://127.0.0.1:9944');
	const [err, api] = await to(ApiPromise.create({ provider }));
	if (err || api === undefined) {
		console.log('Fatal: ', err.message);
		return;
	}

 	const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
	const substrate = new Substrate(statusBar, context.globalState, api);

	const trees = new Map();
	trees.set('nodes', new treeViews.NodesTreeView(substrate));
	trees.set('extrinsics', new treeViews.ExtrinsicsTreeView(substrate));
	trees.set('states', new treeViews.StatesTreeView(substrate));
	trees.set('accounts', new treeViews.AccountsTreeView(substrate));

	try {
		for (const [treeName, treeObject] of trees) {
			const treeCom = (commands as any)[treeName];
			for (const name of Object.keys(treeCom)) {
				const com = new treeCom[name](context, trees, substrate, treeName);
			}
			vscode.window.registerTreeDataProvider(treeName, treeObject);
		}
	} catch(err) {
		console.log('Failed to register command');
	}

	substrate.setup();
}

export async function deactivate() {
	vscode.window.showInformationMessage('Thanks for a great time together');
}
