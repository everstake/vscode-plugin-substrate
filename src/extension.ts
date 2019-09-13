import * as vscode from 'vscode';

import * as commands from '@/commands';
import * as treeViews from '@/trees';
import { Substrate } from '@/substrate';

export async function activate(context: vscode.ExtensionContext) {
 	const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
	const substrate = new Substrate(statusBar, context);

	const trees = new Map();
	trees.set('nodes', new treeViews.NodesTreeView(context, substrate));
	trees.set('extrinsics', new treeViews.ExtrinsicsTreeView(context, substrate));
	trees.set('states', new treeViews.StatesTreeView(context, substrate));
	trees.set('accounts', new treeViews.AccountsTreeView(context, substrate));
	trees.set('contracts', new treeViews.ContractsTreeView(context, substrate));

	try {
		for (const [treeName, treeObject] of trees) {
			const treeCom = (commands as any)[treeName];
			for (const name of Object.keys(treeCom)) {
				console.log(name, treeName);
				const com = new treeCom[name](context, trees, substrate, treeName);
			}
			vscode.window.registerTreeDataProvider(treeName, treeObject);
		}
	} catch(err) {
		console.log(`Failed to register commands: ${err}`);
		vscode.window.showInformationMessage(`Failed to register commands: ${err.message}`);
		return;
	}

	await substrate.setup();
}

export async function deactivate() {
	vscode.window.showInformationMessage('Thanks for a great time together');
}
