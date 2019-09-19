import * as vscode from 'vscode';

import { Module, StateItem, InfoItem } from '@/trees/items';
import { Substrate } from '@/substrate';
import { TreeView } from '@/common';

type Item = Module | StateItem | InfoItem;

export class StatesTreeView extends TreeView<Item> {
	constructor(private context: vscode.ExtensionContext, private substrate: Substrate) {
		super();
	}

	getChildren(element?: Item): Thenable<Item[]> {
		let items = this.getItems(element);
		if (items.length <= 0) {
			items = [new InfoItem(this.context, 'Connect to node to subscribe for state chain')];
		}
		return Promise.resolve(items);
	}

	getItems(element?: Item): Item[] {
		let labels: string[] = [];
		let descriptions: string[] = [];
		let isModule: boolean;

		if (element) {
			[labels, descriptions] = this.substrate.getStates(element.label);
			isModule = false;
		} else {
			labels = this.substrate.getStateModules();
			isModule = true;
		}

		return labels.map((value, index) => {
			if (isModule) {
				return new Module(this.context, value);
			}
			return new StateItem(this.context, value, element!.label, descriptions[index]);
		});
	}
}
