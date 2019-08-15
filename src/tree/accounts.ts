import * as vscode from 'vscode';
import * as path from 'path';

import { Substrate } from '../substrate';

type Item = AccountItem;

export class AccountsTreeView implements vscode.TreeDataProvider<Item> {
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
			vscode.window.showInformationMessage('Not connected to any node');
			return Promise.resolve([]);
		}
		const items = this.getItems(element);
		return Promise.resolve(items);
	}

	getItems(element?: Item): Item[] {
		const accounts = this.substrate.getAcccounts();
        console.log("TCL: AccountsTreeVieww -> constructor -> accounts", accounts);
		return accounts.map(({ name, address }) => new AccountItem(name, address));
	}
}

export class AccountItem extends vscode.TreeItem {
	contextValue = 'account';
	iconPath = {
		dark: path.join(__filename, '..', '..', '..', 'assets', 'dark', 'account.svg'),
		light: path.join(__filename, '..', '..', '..', 'assets', 'light', 'account.svg'),
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
