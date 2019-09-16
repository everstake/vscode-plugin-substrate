import * as vscode from 'vscode';

import BaseCommand from "@/common/baseCommand";

export class ForgetCodeHashCommand extends BaseCommand {
    async run() {
        vscode.window.showInformationMessage('ForgetCodeHash command');
    }
}
