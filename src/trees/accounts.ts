import * as vscode from 'vscode';

import { Substrate } from '@/substrate';
import { AccountItem } from '@/trees/items';
import { TreeView } from '@/common';

type Item = AccountItem;

export class AccountsTreeView extends TreeView<Item> {
	constructor(private context: vscode.ExtensionContext, private substrate: Substrate) {
		super();
	}

	getChildren(element?: Item): Thenable<Item[]> {
		const items = this.getItems(element);
		return Promise.resolve(items);
	}

	getItems(element?: Item): Item[] {
		const accounts = this.substrate.getAcccounts();
		return accounts.map(({ meta: { name }, address }) => new AccountItem(this.context, name, address));
	}
}
