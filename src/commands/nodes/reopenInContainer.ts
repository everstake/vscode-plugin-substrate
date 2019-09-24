import * as vscode from 'vscode';

import { BaseCommand, log } from "@/common";

export class ReopenInContainerCommand extends BaseCommand {
    async run() {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders) {
            log('Can not get devcontainer configuration', 'error', true);
            return;
        }
        const remoteContainersExtension = vscode.extensions.getExtension('ms-vscode-remote.remote-containers');
        if (!remoteContainersExtension) {
            log('Cannot find remote containers extension', 'error', true);
            return;
        }
        if(!remoteContainersExtension.isActive) {
            await remoteContainersExtension.activate();
        }
        await vscode.commands.executeCommand('remote-containers.reopenInContainer');
    }
}
