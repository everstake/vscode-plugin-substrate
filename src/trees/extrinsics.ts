import * as vscode from 'vscode';

import { Module, Extrinsic } from '@/trees/items';
import { Substrate } from '@/substrate';
import { TreeView } from '@/common';

type Item = Module | Extrinsic;

export class ExtrinsicsTreeView extends TreeView<Item> {
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
			[labels, descriptions] = this.substrate.getExtrinsics(element.label);
			isModule = false;
		} else {
			labels = this.substrate.getExtrinsicModules();
			isModule = true;
		}

		return labels.map(
			(value, index) => isModule ?
				new Module(this.context, value) :
				new Extrinsic(this.context, value, element!.label, descriptions[index])
		);
	}
}
