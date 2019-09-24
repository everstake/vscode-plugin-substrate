import { BaseCommand } from "@/common";

export class RefreshCommand extends BaseCommand {
    async run() {
        this.trees.forEach((tree, _) => tree.refresh());
    }
}
