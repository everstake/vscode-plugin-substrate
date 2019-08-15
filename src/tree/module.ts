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
