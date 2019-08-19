import * as vscode from 'vscode';

import BaseCommand from "@/common/baseCommand";
import { AccountsTreeView, AccountItem } from "@/trees";
import { KeyringPair } from '@polkadot/keyring/types';

export class RemoveAccountCommand extends BaseCommand {
    async run(item: AccountItem) {
        const tree = this.trees.get('accounts') as AccountsTreeView;

        // vscode.window.showOpenDialog({
        //     a
        // })

        const accounts = this.context.globalState.get<KeyringPair[]>('accounts') || [];
        const index = accounts.findIndex((val) => val.address === item.description);
        accounts.splice(index, 1);
        this.context.globalState.update('accounts', accounts);
        vscode.window.showInformationMessage(`Successfully removed account "${item.label}"`);

        tree.refresh();
    }
}
