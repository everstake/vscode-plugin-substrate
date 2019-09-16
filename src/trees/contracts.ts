import * as vscode from 'vscode';

import { ContractItem } from '@/trees/items';
import { Substrate } from '@/substrate';
import { TreeView } from '@/common';

type Item = ContractItem;

export type ContractInfo = { name: string, address: string };

export class ContractsTreeView extends TreeView<Item> {
	constructor(private context: vscode.ExtensionContext, private substrate: Substrate) {
		super();
	}

	getChildren(element?: Item): Thenable<Item[]> {
		const items = this.getItems(element);
		return Promise.resolve(items);
	}

	getItems(element?: Item): Item[] {
		const contracts = this.substrate.getContracts();
		const contractItems: Item[] = contracts.map(contract => {
			return new ContractItem(this.context, contract.name, contract.address);
		});
		contractItems.push(new ContractItem(this.context, 'Base Contract', '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'));
		return contractItems;
	}
}
