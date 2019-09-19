import * as vscode from 'vscode';

import { Substrate } from '@/substrate';
import { AccountItem, InfoItem } from '@/trees/items';
import { TreeView } from '@/common';

type Item = AccountItem | InfoItem;

export class AccountsTreeView extends TreeView<Item> {
	constructor(private context: vscode.ExtensionContext, private substrate: Substrate) {
		super();
	}

	getChildren(element?: Item): Thenable<Item[]> {
		let items = this.getItems(element);
		if (items.length <= 0) {
			items = [new InfoItem(this.context, 'No accounts found')];
		}
		return Promise.resolve(items);
	}

	getItems(element?: Item): Item[] {
		const accounts = this.substrate.getAcccounts();
		return accounts.map(({ meta: { name }, address }) => new AccountItem(this.context, name, address));
	}
}
