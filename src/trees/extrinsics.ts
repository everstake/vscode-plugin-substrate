import * as vscode from 'vscode';

import { Module, Extrinsic } from '@/trees/items';
import { Substrate } from '@/substrate';
import { TreeView } from '@/common';

type Item = Module | Extrinsic;

export class ExtrinsicsTreeView extends TreeView<Item> {
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
		let labels: string[] = [];
		let descriptions: string[] = [];
		let isModule: boolean;

		if (element) {
			[labels, descriptions] = this.substrate.getExtrinsics(element.label);
			isModule = false;
		} else {
			labels = this.substrate.getExtrinsicModules();
			isModule = true;
		}

		return labels.map((value, index) => isModule ? new Module(value) : new Extrinsic(value, element!.label, descriptions[index]));
	}
}
