import * as vscode from 'vscode';

import BaseCommand from "@/common/baseCommand";
import { NodesTreeView } from "@/trees";

export class ClearChainDataCommand extends BaseCommand {
    async run() {
        const tree = this.trees.get('nodes') as NodesTreeView;

        console.log('Todo: Add clear chain data logic');

        tree.refresh();
    }
}
