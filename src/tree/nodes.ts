import * as vscode from 'vscode';
import * as path from 'path';

import { Substrate } from '../substrate';

type Item = NodeItem;

export type NodeInfo = { name: string, ip: string };

export class NodesTreeView implements vscode.TreeDataProvider<Item> {
	private _onDidChangeTreeData: vscode.EventEmitter<Item | undefined> = new vscode.EventEmitter<Item | undefined>();
	readonly onDidChangeTreeData: vscode.Event<Item | undefined> = this._onDidChangeTreeData.event;

	constructor(private substrate: Substrate) {}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: Item): vscode.TreeItem {
		return element;
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
		return nodes.map(({ name, ip }) => new NodeItem(name, ip));
	}

	async addNode() {
		// await this.substrate.addNode();
		this.refresh();
	}

	async removeNode(item: Item) {
		// await this.substrate.removeNode(item);
		this.refresh();
	}
}

export class NodeItem extends vscode.TreeItem {
	contextValue = 'node';
	iconPath = {
		dark: path.join(__filename, '..', '..', '..', 'assets', 'dark', 'node.svg'),
		light: path.join(__filename, '..', '..', '..', 'assets', 'light', 'node.svg'),
	};

	constructor(
		public readonly label: string,
		public readonly description: string,
		public readonly command?: vscode.Command,
	) {
		super(label, vscode.TreeItemCollapsibleState.None);
	}

	get tooltip(): string {
		return this.description;
	}
}
