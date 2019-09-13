import * as vscode from 'vscode';

import BaseCommand from "@/common/baseCommand";

export class UploadWasmCommand extends BaseCommand {
    async run() {
        vscode.window.showInformationMessage('UploadWasm command');
    }
}
