import * as vscode from 'vscode';

import { ContractItem, ContractCodeItem } from '@/trees/items';
import { Substrate } from '@/substrate';
import { TreeView } from '@/common';

export type ContractInfo = { name: string, address: string };
export type ContractCodeInfo = { name: string, hash: string, contracts: ContractInfo[] };

export type ContractsTreeItem = ContractItem | ContractCodeItem;
type Item = ContractsTreeItem;

export class ContractsTreeView extends TreeView<Item> {
	constructor(private context: vscode.ExtensionContext, private substrate: Substrate) {
		super();
	}

	getChildren(element?: Item): Thenable<Item[]> {
		const items = this.getItems(element);
		return Promise.resolve(items);
	}

	getItems(element?: Item): Item[] {
		if (element) {
			const items = (element as ContractCodeItem).contracts;
			return items.map(contract => {
				return new ContractItem(this.context, contract.name, contract.address);
			});
		}
		try {
			const codes = this.substrate.getConnectionContractCodes();
			const contractItems: Item[] = codes.map(code => {
				return new ContractCodeItem(this.context, code.name, code.hash, code.contracts);
			});
			return contractItems;
		} catch (err) {
			console.log(`Failed to get contracts and codes`);
			return [];
		}
	}
}
