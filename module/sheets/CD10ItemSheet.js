export default class CD10ItemSheet extends ItemSheet {

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            width: 725,
            height: 600,
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

        /* Make system settings available for sheets to use for rendering */
        sheetData.damageTypeSetting = game.settings.get("cd10", "systemDamageTypes");
        sheetData.hitLocationSetting = game.settings.get("cd10", "systemHitLocation");
        sheetData.encumbranceSetting = game.settings.get("cd10", "systemEncumbrance");
        sheetData.barterSetting = game.settings.get("cd10", "systemBarter");
        sheetData.modernity = game.settings.get("cd10", "systemModernity");

        let g = game.items.filter((s) => s.type === "skill");
        let gameSkillList = {};

        for (let i = 0; i < g.length; i++) {
            let a = g[i].data.data.matchID.value,
                b = g[i].name
            gameSkillList[a] = b;
        }

        sheetData.gameSkills = gameSkillList;

        return sheetData;
    }

    activateListeners(html) {

        html.find(".protection-check-box").click(this._protectionCheckBoxClicked.bind(this));
        html.find(".damage-select").click(this._onDamageSelect.bind(this));
        html.find(".teachable-check").click(this._onTeachableClick.bind(this));
        html.find(".physical-check").click(this._onPhysicalClick.bind(this));
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

    async _onTeachableClick(event) {
        /* Monitor the state of the teachable state of skills */
        event.preventDefault();
        let value = this.item.data.data.teachable.value;
        await this.item.update({
            "data.teachable.value": !value
        });
    }

    async _onPhysicalClick(event) {
        /* Monitor the state of physical debilitation setting for skills. */
        event.preventDefault();
        let value = this.item.data.data.isPhysical.value;
        await this.item.update({
            "data.isPhysical.value": !value
        });
    }

    async _onDamageSelect(event) {
        /* Monitor the state of damage types on Ammo Sheets. */
        event.preventDefault();
        const damageType = event.currentTarget.dataset.damageType;

        await this.item.update({
            "data.damage": {
                "slash": {
                    "selected": false
                },
                "pierce": {
                    "selected": false
                },
                "blunt": {
                    "selected": false
                },
                "energy": {
                    "selected": false
                }
            }
        });

        await this.item.update({
            [`data.damage.${damageType}.selected`]: true
        });
    }
}