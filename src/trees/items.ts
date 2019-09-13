import * as vscode from 'vscode';
import { assets } from '@/common';

export class Module extends vscode.TreeItem {
	contextValue = 'module';

	constructor(
		public readonly context: vscode.ExtensionContext,
		public readonly label: string,
		public readonly command?: vscode.Command,
	) {
		super(label, vscode.TreeItemCollapsibleState.Collapsed);
	}

	get iconPath(): { dark: string, light: string } {
		return {
			dark: assets(this.context, 'dark', 'module.svg'),
			light: assets(this.context, 'light', 'module.svg'),
		};
	}
}

export type ExtrinsicParameter = { type: string, name: string };

export class Extrinsic extends vscode.TreeItem {
	contextValue = 'extrinsic';

	constructor(
		public readonly context: vscode.ExtensionContext,
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

	get iconPath(): { dark: string, light: string } {
		return {
			dark: assets(this.context, 'dark', 'extrinsic.svg'),
			light: assets(this.context, 'light', 'extrinsic.svg'),
		};
	}
}

export class NodeItem extends vscode.TreeItem {
	contextValue = 'node';

	constructor(
		public readonly context: vscode.ExtensionContext,
		public readonly label: string,
		public readonly description: string,
		public readonly isActive: boolean,
		public readonly isConnected: boolean,
		public readonly command?: vscode.Command,
	) {
		super(label, vscode.TreeItemCollapsibleState.None);
	}

	get tooltip(): string {
		return this.description;
	}

	get iconPath(): { dark: string, light: string } {
		if (this.isActive) {
			return {
				dark: assets(this.context, 'dark', this.isConnected ? 'connected.svg' : 'disconnected.svg'),
				light: assets(this.context, 'light', this.isConnected ? 'connected.svg' : 'disconnected.svg'),
			};
		}
		return {
			dark: assets(this.context, 'dark', 'node.svg'),
			light: assets(this.context, 'light', 'node.svg'),
		};
	}
}

export class StateItem extends vscode.TreeItem {
	contextValue = 'state';

	constructor(
		public readonly context: vscode.ExtensionContext,
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

	get iconPath(): { dark: string, light: string } {
		return {
			dark: assets(this.context, 'dark', 'download.svg'),
			light: assets(this.context, 'light', 'download.svg'),
		};
	}
}

export class AccountItem extends vscode.TreeItem {
	contextValue = 'account';

	constructor(
		public readonly context: vscode.ExtensionContext,
		public readonly label: string,
		public readonly description: string,
		public readonly command?: vscode.Command,
	) {
		super(label, vscode.TreeItemCollapsibleState.None);
	}

	get tooltip(): string {
		return this.description;
	}

	get iconPath(): { dark: string, light: string } {
		return {
			dark: assets(this.context, 'dark', 'account.svg'),
			light: assets(this.context, 'light', 'account.svg'),
		};
	}
}

export class ContractItem extends vscode.TreeItem {
	contextValue = 'contract';

	constructor(
		public readonly context: vscode.ExtensionContext,
		public readonly label: string,
		public readonly description: string,
		public readonly command?: vscode.Command,
	) {
		super(label, vscode.TreeItemCollapsibleState.None);
	}

	get tooltip(): string {
		return this.description;
	}

	get iconPath(): { dark: string, light: string } {
		return {
			dark: assets(this.context, 'dark', 'contract.svg'),
			light: assets(this.context, 'light', 'contract.svg'),
		};
	}
}
