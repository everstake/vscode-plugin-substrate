import * as vscode from 'vscode';

import BaseCommand from "@/common/baseCommand";
import { Extrinsic, ExtrinsicParameter } from "@/trees";

export class RunExtrinsicCommand extends BaseCommand {
    async run(item: Extrinsic) {
        const module = this.substrate.api.tx[item.module];
        const extrinsic = module[item.label];
        const extObj = extrinsic.toJSON();
        const params: ExtrinsicParameter[] = extObj.args;

        // Todo: Use multi imput
        // Todo: Choose account
        const responses = await this.substrate.getValuesFromInput(params);
        if (responses.length < params.length) {
        	vscode.window.showInformationMessage('Extrinsic execution canceled');
            return;
        }
        // Todo: Sign transaction with choosed account
        // const result = extrinsic(...responses).signAndSend();
        console.log("TCL: Substrate -> runExtrinsic -> responses", responses);
    }
}
