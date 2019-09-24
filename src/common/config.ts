import * as vscode from 'vscode';

export const setupConfiguration = async (): Promise<vscode.WorkspaceConfiguration> => {
	vscode.workspace.onDidChangeConfiguration(
		async (event: vscode.ConfigurationChangeEvent) => {
			const pluginConfigurationChanged = event.affectsConfiguration('plugin-polkadot');
			if (pluginConfigurationChanged) {
				await vscode.commands.executeCommand('nodes.refresh');
			}
		}
	);
    const configuration = vscode.workspace.getConfiguration();
    return configuration;
};
