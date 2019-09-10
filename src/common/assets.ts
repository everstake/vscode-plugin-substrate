import * as vscode from 'vscode';
import * as path from 'path';

export const assets = (context: vscode.ExtensionContext, ...val: string[]) => {
    const onDiskPath = vscode.Uri.file(
        path.join(context.extensionPath, 'assets', ...val)
    );
    const src = onDiskPath.with({ scheme: 'vscode-resource' });
    return src.fsPath;
}
