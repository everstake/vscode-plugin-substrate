import * as vscode from 'vscode';

import BaseCommand from "@/common/baseCommand";
import { AccountsTreeView, AccountItem } from "@/trees";
import { KeyringPair } from '@polkadot/keyring/types';

export class RemoveAccountCommand extends BaseCommand {
    async run(item: AccountItem) {
        const accounts = this.context.globalState.get<KeyringPair[]>('accounts') || [];
        const index = accounts.findIndex((val) => val.meta.name === item.label);
        accounts.splice(index, 1);
        this.context.globalState.update('accounts', accounts);
        vscode.window.showInformationMessage(`Successfully removed account "${item.label}"`);

        const tree = this.trees.get('accounts') as AccountsTreeView;
        tree.refresh();
    }
}
