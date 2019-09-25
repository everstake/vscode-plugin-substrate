import * as vscode from 'vscode';
import { Trees } from '@/trees';
import { Substrate } from '@/substrate';
import { log } from '@/common';

import * as accounts from './accounts';
import * as extrinsics from './extrinsics';
import * as nodes from './nodes';
import * as states from './states';
import * as contracts from './contracts';

const commands = {
    accounts,
    extrinsics,
    nodes,
    states,
    contracts,
};

export {
    accounts,
    extrinsics,
    nodes,
    states,
    contracts,
};

export default async (context: vscode.ExtensionContext, trees: Trees, substrate: Substrate) => {
	try {
		for (const [treeName, treeObject] of trees) {
			const treeCom = (commands as any)[treeName];
			for (const name of Object.keys(treeCom)) {
				const _ = new treeCom[name](context, trees, substrate, treeName);
			}
			vscode.window.registerTreeDataProvider(treeName, treeObject);
		}
	} catch(err) {
		log(`Failed to register commands: ${err.message}`, 'error', true);
		return;
	}
};
