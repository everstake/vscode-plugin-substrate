import * as vscode from 'vscode';

import { ContractItem } from '@/trees/items';
import { Substrate } from '@/substrate';
import { TreeView } from '@/common';

export type ContractInfo = { name: string, hash: string };
export type ContractCodeInfo = { name: string, hash: string };

export type ContractsTreeItem = ContractItem;
type Item = ContractItem;

export class ContractsTreeView extends TreeView<Item> {
	constructor(private context: vscode.ExtensionContext, private substrate: Substrate) {
		super();
	}

	getChildren(element?: Item): Thenable<Item[]> {
		const items = this.getItems(element);
		return Promise.resolve(items);
	}

	getItems(element?: Item): Item[] {
		try {
			const contracts = this.substrate.getConnectionContractCodes();
			const contractItems: Item[] = contracts.map(contract => {
				return new ContractItem(this.context, contract.name, contract.hash);
			});
			// contractItems.push(new ContractItem(this.context, 'Base Contract', '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'));
			return contractItems;
		} catch (err) {
			console.log(`Failed to get contracts and codes`);
			return [];
		}
	}
}
