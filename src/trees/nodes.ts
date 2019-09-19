import * as vscode from 'vscode';

import { NodeItem, InfoItem } from '@/trees/items';
import { Substrate } from '@/substrate';
import { TreeView } from '@/common';

type Item = NodeItem | InfoItem;

export type NodeInfo = { name: string, endpoint: string };

export class NodesTreeView extends TreeView<Item> {
	constructor(private context: vscode.ExtensionContext, private substrate: Substrate) {
		super();
	}

	getChildren(element?: Item): Thenable<Item[]> {
		let items = this.getItems(element);
		if (items.length <= 0) {
			items = [new InfoItem(this.context, 'No node connections found')];
		}
		return Promise.resolve(items);
	}

	getItems(element?: Item): Item[] {
		const nodes = this.substrate.getNodes();
		const node = this.context.globalState.get('connected-node');
		const isConnected = this.substrate.isConnected;
		return nodes.map(({ name, endpoint }) => {
			const isActive = node === name;
			return new NodeItem(this.context, name, endpoint, isActive, isActive && isConnected);
		});
	}
}
