import * as vscode from 'vscode';

import BaseCommand from "@/common/baseCommand";
import { AccountsTreeView } from "@/trees";
import { KeyringPair } from '@polkadot/keyring/types';

export class AddAccountCommand extends BaseCommand {
    async run() {
        const tree = this.trees.get('accounts') as AccountsTreeView;

        const name = await vscode.window.showInputBox({
            prompt: `Account name`,
        });
        if (name === undefined) {
            return;
        }
        const key = await vscode.window.showInputBox({
            prompt: `Account key`,
        });
        if (key === undefined) {
            return;
        }
        if (this.substrate.isAccountExists(key)) {
            vscode.window.showWarningMessage('Account with same key already exists. Account not added');
            return;
        }

        const pair = this.substrate.createKeyringPair(key);
        pair.setMeta({ name });

        const accounts = this.context.globalState.get<KeyringPair[]>('accounts') || [];
        accounts.push(pair);
        this.context.globalState.update('accounts', accounts);

        tree.refresh();
    }
}
