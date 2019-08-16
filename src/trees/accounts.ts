import * as vscode from 'vscode';

import { Substrate } from '@/substrate';
import { AccountItem } from '@/trees/items';
import { TreeView } from '@/common';

type Item = AccountItem;

export class AccountsTreeView extends TreeView<Item> {
	constructor(private substrate: Substrate) {
		super();
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
		return accounts.map(({ meta: { name }, address }) => new AccountItem(name, address));
	}
}
