import * as vscode from 'vscode';
import { Abi } from '@polkadot/api-contract';

import { ContractItem, ContractCodeItem, SeparatorItem, InfoItem } from '@/trees/items';
import { Substrate } from '@/substrate';
import { TreeView, log } from '@/common';

export type ContractInfo = { name: string, address: string, abi: Abi };
export type ContractCodeInfo = { name: string, hash: string };

export type ContractsTreeItem = ContractItem | ContractCodeItem | SeparatorItem | InfoItem;
type Item = ContractsTreeItem;

export class ContractsTreeView extends TreeView<Item> {
	constructor(private context: vscode.ExtensionContext, private substrate: Substrate) {
		super();
	}

	getChildren(element?: Item): Thenable<Item[]> {
		let items = this.getItems(element);
		if (items.length <= 0) {
			items = [new InfoItem(this.context, 'No contracts and codes found')];
		}
		return Promise.resolve(items);
	}

	getItems(element?: Item): Item[] {
		try {
			const codes = this.substrate.getConnectionContractCodes();
			const contractCodeItems: Item[] = codes.map(code => {
				return new ContractCodeItem(this.context, code.name, code.hash);
			});
			const contracts = this.substrate.getConnectionContracts();
			const contractItems: Item[] = contracts.map(contract => {
				return new ContractItem(this.context, contract.name, contract.address, contract.abi);
			});
			return [
				...contractCodeItems,
				...(contractItems.length <= 0 || contractCodeItems.length <= 0 ? [] : [new SeparatorItem(this.context)]),
				...contractItems,
			];
		} catch (err) {
			log(`Failed to get contracts and codes: ${err.message}`, 'error', false);
			return [];
		}
	}
}
