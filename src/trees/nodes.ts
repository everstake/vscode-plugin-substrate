import * as vscode from 'vscode';

import { NodeItem } from '@/trees/items';
import { Substrate } from '@/substrate';
import { TreeView } from '@/common';

type Item = NodeItem;

export type NodeInfo = { name: string, endpoint: string };

export class NodesTreeView extends TreeView<Item> {
	constructor(private substrate: Substrate) {
		super();
	}

	getChildren(element?: Item): Thenable<Item[]> {
		if (!this.substrate.isConnected()) {
			vscode.window.showInformationMessage('Not connected to node');
			return Promise.resolve([]);
		}
		const items = this.getItems(element);
		return Promise.resolve(items);
	}

	getItems(element?: Item): Item[] {
		const nodes = this.substrate.getNodes();
		return nodes.map(({ name, endpoint }) => new NodeItem(name, endpoint));
	}
}
