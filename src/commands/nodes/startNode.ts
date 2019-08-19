import * as vscode from 'vscode';
import { promisify } from 'util';
import to from 'await-to-js';
import { exec as cp_exec } from 'child_process';

import BaseCommand from "@/common/baseCommand";
import { NodesTreeView } from "@/trees";

const exec = promisify(cp_exec);

export class StartNodeCommand extends BaseCommand {
    async run() {
        const tree = this.trees.get('nodes') as NodesTreeView;

        console.log('Starting substrate node');

        const [err, data] = await to(exec('which substrate & which cargo'));
        if (err) {
            vscode.window.showErrorMessage("Substrate not installed");
            return;
        }
    	vscode.window.showInformationMessage('Substrate node running on port: 9944');

        tree.refresh();
    }
}
