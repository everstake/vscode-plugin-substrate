import * as vscode from 'vscode';

import BaseCommand from "@/common/baseCommand";

export class AddExistingCodeCommand extends BaseCommand {
    async run() {
        vscode.window.showInformationMessage('AddExistingCode command');
    }
}
