import * as vscode from 'vscode';

import BaseCommand from "@/common/baseCommand";

export class ReopenInContainerCommand extends BaseCommand {
    async run() {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders) {
            vscode.window.showErrorMessage("Can not get devcontainer configuration");
            return;
        }
        const remoteContainersExtension = vscode.extensions.getExtension('ms-vscode-remote.remote-containers');
        if (!remoteContainersExtension) {
            console.error('Cannot find remote containers extension');
            vscode.window.showErrorMessage('Cannot find remote containers extension');
            return;
        }
        if(!remoteContainersExtension.isActive) {
            await remoteContainersExtension.activate();
        }
        await vscode.commands.executeCommand('remote-containers.reopenInContainer');
    }
}
