import * as vscode from 'vscode';

import BaseCommand from "@/common/baseCommand";

export class AddExistingContractCommand extends BaseCommand {
    async run() {
        vscode.window.showInformationMessage('AddExistingContract command');
    }
}
