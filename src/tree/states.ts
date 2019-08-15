import * as vscode from 'vscode';
import * as path from 'path';

import { Module } from './module';
import { Substrate } from '../substrate';

type Item = Module | StateItem;

export class StatesTreeView implements vscode.TreeDataProvider<Item> {
	private _onDidChangeTreeData: vscode.EventEmitter<Item | undefined> = new vscode.EventEmitter<Item | undefined>();
	readonly onDidChangeTreeData: vscode.Event<Item | undefined> = this._onDidChangeTreeData.event;

	constructor(private substrate: Substrate) {}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: Item): vscode.TreeItem {
		return element;
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
			// Todo: Add command to fetch chain data
			return new StateItem(value, element!.label, descriptions[index]);
		});
	}
}

export class StateItem extends vscode.TreeItem {
	contextValue = 'state';
	iconPath = {
		dark: path.join(__filename, '..', '..', '..', 'assets', 'dark', 'download.svg'),
		light: path.join(__filename, '..', '..', '..', 'assets', 'light', 'download.svg'),
	};

	constructor(
		public readonly label: string,
		public readonly module: string,
		public readonly description: string,
		public readonly command?: vscode.Command,
	) {
		super(label, vscode.TreeItemCollapsibleState.None);
	}

	get tooltip(): string {
		return this.description;
	}
}
