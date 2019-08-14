import * as vscode from 'vscode';
import * as path from 'path';

import { Substrate } from './substrate';

type Item = Module | Extrinsic;

export class TreeViewProvider implements vscode.TreeDataProvider<Item> {
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
		let labels = [];
		let isModule: boolean;

		if (element) {
			labels = this.substrate.getExtrinsics(element.label);
			isModule = false;
		} else {
			labels = this.substrate.getExtrinsicModules();
			isModule = true;
		}

		return labels.map((value) => isModule ? new Module(value) : new Extrinsic(value));
	}
}

export class Extrinsic extends vscode.TreeItem {
	contextValue = 'extrinsic';
	iconPath = {
		dark: path.join(__filename, '..', '..', 'assets', 'dark', 'extrinsic.svg'),
		light: path.join(__filename, '..', '..', 'assets', 'light', 'extrinsic.svg'),
	};

	constructor(
		public readonly label: string,
		public readonly command?: vscode.Command,
	) {
		super(label, vscode.TreeItemCollapsibleState.None);
	}
}

export class Module extends vscode.TreeItem {
	contextValue = 'module';
	iconPath = {
		dark: path.join(__filename, '..', '..', 'assets', 'dark', 'module.svg'),
		light: path.join(__filename, '..', '..', 'assets', 'light', 'module.svg'),
	};

	constructor(
		public readonly label: string,
		public readonly command?: vscode.Command,
	) {
		super(label, vscode.TreeItemCollapsibleState.Collapsed);
	}
}
