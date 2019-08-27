import * as vscode from 'vscode';

import { Module, StateItem } from '@/trees/items';
import { Substrate } from '@/substrate';
import { TreeView } from '@/common';

type Item = Module | StateItem;

export class StatesTreeView extends TreeView<Item> {
	constructor(private context: vscode.ExtensionContext, private substrate: Substrate) {
		super();
	}

	getChildren(element?: Item): Thenable<Item[]> {
		const items = this.getItems(element);
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
				return new Module(value);
			}
			return new StateItem(value, element!.label, descriptions[index]);
		});
	}
}
