import * as vscode from 'vscode';

import { Substrate } from '@/substrate';
import registerTrees from '@/trees';
import { setupConfiguration, log } from '@/common';
import registerCommands from '@/commands';

export async function activate(context: vscode.ExtensionContext) {
	const config = await setupConfiguration();
	const substrate = new Substrate(context, config);

	const trees = await registerTrees(context, substrate);
	await registerCommands(context, trees, substrate);

	if (config.get<boolean>('plugin-polkadot.setupDefaultConnectionOnStart')) {
		await substrate.setupConnection();
	}
	if (config.get<boolean>('plugin-polkadot.installSubstrateUpdatesOnStart')) {
		await substrate.installSubstrate();
	}
}

export async function deactivate() {
	log('Thanks for a great time together', 'info', true);
}
