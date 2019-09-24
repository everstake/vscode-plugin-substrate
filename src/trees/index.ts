import * as vscode from 'vscode';

import * as treeViews from '@/trees';
import { TreeView } from '@/common';
import { Substrate } from '@/substrate';

export * from './extrinsics';
export * from './accounts';
export * from './states';
export * from './nodes';
export * from './items';
export * from './contracts';

export type Trees = Map<string, TreeView<any>>;

export default async (context: vscode.ExtensionContext, substrate: Substrate): Promise<Trees> => {
	const trees = new Map();
	trees.set('nodes', new treeViews.NodesTreeView(context, substrate));
	trees.set('extrinsics', new treeViews.ExtrinsicsTreeView(context, substrate));
	trees.set('states', new treeViews.StatesTreeView(context, substrate));
	trees.set('accounts', new treeViews.AccountsTreeView(context, substrate));
	trees.set('contracts', new treeViews.ContractsTreeView(context, substrate));
    // New trees will be added here
	return trees;
};
