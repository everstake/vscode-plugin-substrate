import * as vscode from 'vscode';

import BaseCommand from "@/common/baseCommand";

export class DeployContractCommand extends BaseCommand {
    async run() {
        vscode.window.showInformationMessage('DeployContract command');
    }
}
