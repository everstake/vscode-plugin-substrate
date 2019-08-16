import * as vscode from 'vscode';
import { TreeView } from '@/common/treeView';
import { Substrate } from '@/substrate';

type Trees = Map<string, TreeView<any>>;

export default abstract class BaseCommand {
  constructor(protected context: vscode.ExtensionContext, protected trees: Trees, protected substrate: Substrate, view: string) {
    const replacedName = this.constructor.name.replace(/Command$/, '');
    const commandName = replacedName.charAt(0).toLowerCase() + replacedName.slice(1);
    const disposable = vscode.commands.registerCommand(`${view}.${commandName}`, this.run, this);
    this.context.subscriptions.push(disposable);
  }

  abstract run(...args: any[]): void;
}
