import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import to from 'await-to-js';

import BaseCommand from "@/common/baseCommand";

const devcontainerFile = {
	name: "Rust",
	dockerFile: "Dockerfile",
	runArgs: [
		"--cap-add=SYS_PTRACE", "--security-opt", "seccomp=unconfined"
	],
	settings: {
		"terminal.integrated.shell.linux": "/bin/bash",
		"lldb.adapterType": "bundled",
		"lldb.executable": "/usr/bin/lldb"
	},
	extensions: [
		"rust-lang.rust",
		"enfipy.plugin-polkadot",
		"bungcip.better-toml",
		"vadimcn.vscode-lldb"
	]
};

const dockerFile = `# Phusion image based on Ubuntu
FROM phusion/baseimage:0.10.2

ENV TERM=xterm
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \\
    apt-get --yes --force-yes -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" upgrade && \\
    apt-get --yes --force-yes -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" dist-upgrade
RUN apt-get install -y cmake pkg-config libssl-dev git clang && \\
	curl https://sh.rustup.rs -sSf | sh -s -- -y
ENV PATH=/root/.cargo/bin:$PATH

RUN rustup toolchain install nightly && \\
    rustup default nightly && \\
	rustup target add wasm32-unknown-unknown --toolchain nightly && \\
	cargo install --git https://github.com/alexcrichton/wasm-gc

ENV DEBIAN_FRONTEND=
`;

export class ConfigureDevcontainerCommand extends BaseCommand {
    async run() {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders) {
            vscode.window.showErrorMessage("Can not get workspace folder path");
            return;
        }
        const workspacePath: string = folders[0].uri.fsPath;

        const folderPath = path.join(workspacePath, '.devcontainer');
        const devcontainerFilePath = path.join(folderPath, 'devcontainer.json');
        const dockerFilefilePath = path.join(folderPath, 'Dockerfile');

        let [err] = await to(fs.promises.access(folderPath, fs.constants.W_OK | fs.constants.R_OK));
        if (err) {
            // console.error(`Failed to access devcontainer folder: ${err}`);
            if (!await this.createFolder(folderPath)) {
                vscode.window.showInformationMessage('Failed to create devcontainer folder');
                return;
            }
        }

        [err] = await to(fs.promises.access(devcontainerFilePath, fs.constants.W_OK | fs.constants.R_OK));
        if (err) {
            // console.error(`Failed to access devcontainer file: ${err}`);
            const data = `${JSON.stringify(devcontainerFile, null, 2)}\n`;
            if (!await this.createFile(devcontainerFilePath, data)) {
                vscode.window.showInformationMessage('Failed to create devcontainer file');
                return;
            } else {
                vscode.window.showInformationMessage('Successfully created devcontainer file');
            }
        }

        [err] = await to(fs.promises.access(dockerFilefilePath, fs.constants.W_OK | fs.constants.R_OK));
        if (err) {
            // console.error(`Failed to access docker file: ${err}`);
            if (!await this.createFile(dockerFilefilePath, dockerFile)) {
                vscode.window.showInformationMessage('Failed to create devcontainer file');
            } else {
                vscode.window.showInformationMessage('Successfully created devcontainer file');
            }
            return;
        }

        vscode.window.showWarningMessage('Configuration already exists');
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
