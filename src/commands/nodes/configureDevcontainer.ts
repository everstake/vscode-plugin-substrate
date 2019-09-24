import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import to from 'await-to-js';

import { BaseCommand, log } from "@/common";

export class ConfigureDevcontainerCommand extends BaseCommand {
    async run() {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders) {
            log('Can not get workspace folder path', 'error', true);
            return;
        }
        const workspacePath: string = folders[0].uri.fsPath;

        const folderPath = path.join(workspacePath, '.devcontainer');
        const devcontainerFilePath = path.join(folderPath, 'devcontainer.json');
        const dockerFilefilePath = path.join(folderPath, 'Dockerfile');

        let [err] = await to(fs.promises.access(folderPath, fs.constants.W_OK | fs.constants.R_OK));
        if (err) {
            if (!await this.createFolder(folderPath)) {
                log('Failed to create devcontainer folder', 'error', true);
                return;
            }
        }
        [err] = await to(fs.promises.access(devcontainerFilePath, fs.constants.W_OK | fs.constants.R_OK));
        if (err) {
            const devcontainerFile = this.substrate.config.get<string>('plugin-polkadot.defaultDevcontainerFile');
            if (!devcontainerFile) {
                log('Invalid devcontainer file in configuration', 'error', true);
                return;
            }
            const data = `${JSON.stringify(devcontainerFile, null, 2)}\n`;
            if (!await this.createFile(devcontainerFilePath, data)) {
                log('Failed to create devcontainer file', 'error', true);
                return;
            } else {
                log('Successfully created devcontainer file', 'info', true);
            }
        }
        [err] = await to(fs.promises.access(dockerFilefilePath, fs.constants.W_OK | fs.constants.R_OK));
        if (err) {
            const dockerFile = this.substrate.config.get<string>('plugin-polkadot.defaultDevcontainerDockerfile');
            if (!dockerFile) {
                log('Invalid devcontainer Dockerfile file in configuration', 'error', true);
                return;
            }
            if (!await this.createFile(dockerFilefilePath, dockerFile)) {
                log('Failed to create docker file', 'error', true);
            } else {
                log('Successfully created docker file', 'info', true);
            }
            return;
        }
        log('Configuration already exists', 'warn', true);
    }

    async createFolder(folderPath: string): Promise<boolean> {
        const [err, data] = await to(fs.promises.mkdir(folderPath, {recursive: true}));
        if (err) {
            return false;
        }
        return true;
    }

    async createFile(filePath: string, data: string): Promise<boolean> {
        const [err, _] = await to(fs.promises.writeFile(filePath, data, 'utf8'));
        if (err) {
            return false;
        }
        return true;
    }
}
