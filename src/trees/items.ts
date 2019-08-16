import * as vscode from 'vscode';
import * as path from 'path';

export class Module extends vscode.TreeItem {
	contextValue = 'module';
	iconPath = {
		dark: path.join(__filename, '..', '..', '..', 'assets', 'dark', 'module.svg'),
		light: path.join(__filename, '..', '..', '..', 'assets', 'light', 'module.svg'),
	};

	constructor(
		public readonly label: string,
		public readonly command?: vscode.Command,
	) {
		super(label, vscode.TreeItemCollapsibleState.Collapsed);
	}
}

export type ExtrinsicParameter = { type: string, name: string };

export class Extrinsic extends vscode.TreeItem {
	contextValue = 'extrinsic';
	iconPath = {
		dark: path.join(__filename, '..', '..', '..', 'assets', 'dark', 'extrinsic.svg'),
		light: path.join(__filename, '..', '..', '..', 'assets', 'light', 'extrinsic.svg'),
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

export class NodeItem extends vscode.TreeItem {
	contextValue = 'node';
	iconPath = {
		dark: path.join(__filename, '..', '..', '..', 'assets', 'dark', 'node.svg'),
		light: path.join(__filename, '..', '..', '..', 'assets', 'light', 'node.svg'),
	};

	constructor(
		public readonly label: string,
		public readonly description: string,
		public readonly command?: vscode.Command,
	) {
		super(label, vscode.TreeItemCollapsibleState.None);
	}

	get tooltip(): string {
		return this.description;
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

export class AccountItem extends vscode.TreeItem {
	contextValue = 'account';
	iconPath = {
		dark: path.join(__filename, '..', '..', '..', 'assets', 'dark', 'account.svg'),
		light: path.join(__filename, '..', '..', '..', 'assets', 'light', 'account.svg'),
	};

	constructor(
		public readonly label: string,
		public readonly description: string,
		public readonly command?: vscode.Command,
	) {
		super(label, vscode.TreeItemCollapsibleState.None);
	}

	get tooltip(): string {
		return this.description;
	}
}
