import * as vscode from 'vscode';

import BaseCommand from "@/common/baseCommand";

export class ForgetContractCommand extends BaseCommand {
    async run() {
        vscode.window.showInformationMessage('ForgetContract command');
    }
}
