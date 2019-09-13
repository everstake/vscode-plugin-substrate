import * as vscode from 'vscode';

import { ContractItem } from '@/trees/items';
import { Substrate } from '@/substrate';
import { TreeView } from '@/common';

type Item = ContractItem;

export type ContractInfo = { name: string, address: string };

export class ContractsTreeView extends TreeView<Item> {
	constructor(private context: vscode.ExtensionContext, private substrate: Substrate) {
		super();
	}

	getChildren(element?: Item): Thenable<Item[]> {
		const items = this.getItems(element);
		return Promise.resolve(items);
	}

	getItems(element?: Item): Item[] {
		// const nodes = this.substrate.getNodes();
		// const node = this.context.globalState.get('connected-node');
		return [new ContractItem(this.context, 'name', 'address')];
		// return [];
	}
}
