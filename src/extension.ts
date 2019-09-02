import 'module-alias/register';
import * as vscode from 'vscode';
import * as path from 'path';

import * as commands from '@/commands';
import * as treeViews from '@/trees';
import { Substrate } from '@/substrate';

export async function activate(context: vscode.ExtensionContext) {
 	const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
	const substrate = new Substrate(statusBar, context.globalState);

	const trees = new Map();
	trees.set('nodes', new treeViews.NodesTreeView(context, substrate));
	trees.set('extrinsics', new treeViews.ExtrinsicsTreeView(context, substrate));
	trees.set('states', new treeViews.StatesTreeView(context, substrate));
	trees.set('accounts', new treeViews.AccountsTreeView(context, substrate));

	try {
		for (const [treeName, treeObject] of trees) {
			const treeCom = (commands as any)[treeName];
			for (const name of Object.keys(treeCom)) {
				const com = new treeCom[name](context, trees, substrate, treeName);

				// Todo: Remove. Dev only
				if (name === 'RunExtrinsicCommand') {
					const panel = vscode.window.createWebviewPanel(
						'extrinsicResult',
						'Extrinsic Result',
						vscode.ViewColumn.One,
						{
							enableScripts: true,
							retainContextWhenHidden: true,
							localResourceRoots: [ vscode.Uri.file(path.join(context.extensionPath, 'out')) ]
						},
					);
					panel.webview.html = com.getWebviewContent({ data: 'value' });
				}
			}
			vscode.window.registerTreeDataProvider(treeName, treeObject);
		}
	} catch(err) {
		console.log('Failed to register command');
	}

	await substrate.setup();
}

export async function deactivate() {
	await vscode.window.showInformationMessage('Thanks for a great time together');
}
