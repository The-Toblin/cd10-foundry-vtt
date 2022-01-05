export default class CD10ItemSheet extends ItemSheet {

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            width: 560,
            height: 380,
            classes: ["cd10", "sheet", "item"]
        });

    }

    get template() {
        return `systems/cd10/templates/sheets/${this.item.data.type}-sheet.hbs`;
    }

    getData() {
        const baseData = super.getData();
        let sheetData = {
            owner: this.item.isOwner,
            editable: this.isEditable,
            item: baseData.item,
            data: baseData.item.data.data,
            config: CONFIG.cd10
        };

        /* Make system settings available for sheet rendering. */
        sheetData.damageTypeSetting = game.settings.get("cd10", "systemDamageTypes");
        sheetData.hitLocationSetting = game.settings.get("cd10", "systemHitLocation");

        return sheetData;
    }

    activateListeners(html) {

        html.find(".protection-check-box").click(this._protectionCheckBoxClicked.bind(this));
        super.activateListeners(html);
    }

    async _protectionCheckBoxClicked(event) {
        /* Monitor the state of checked body protection for armors */
        event.preventDefault();
        let target = event.currentTarget.dataset.bodyType,
            value = this.item.data.data.coverage[target].value;

        await this.item.update({
            [`data.coverage.${target}.value`]: !value
        });
    }
}