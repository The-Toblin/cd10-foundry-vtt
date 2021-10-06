export default class CD10NamedCharacterSheet extends ActorSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: "systems/CD10/templates/sheets/namedCharacter-sheet.hbs",
            classes: ["cd10", "sheet", "namedCharacter"],
        });
    }

    get template() {
        return `systems/cd10/templates/sheets/namedCharacter-sheet.hbs`;
    }

    getData() {
        let sheetData = super.getData();
        sheetData.config = CONFIG.cd10;
        sheetData.data = sheetData.data.data;
        sheetData.weapons = sheetData.items.filter(function(item) {
            return item.type == "weapon";
        });
        sheetData.armors = sheetData.items.filter(function(item) {
            return item.type == "armor";
        });
        sheetData.skills = sheetData.items.filter(function(item) {
            return item.type == "skill";
        });
        sheetData.traits = sheetData.items.filter(function(item) {
            return item.type == "trait";
        });
        console.log(sheetData.items);
        return sheetData;
    }

    activateListeners(html) {
        html.find(".item-create").click(this._onItemCreate.bind(this));
        html.find(".inline-edit").change(this._onSkillEdit.bind(this));
        html.find(".item-delete").click(this._onItemDelete.bind(this));

        super.activateListeners(html);
    }

    _onItemCreate(event) {
        event.preventDefault();
        let element = event.currentTarget;

        let itemData = {
            name: game.i18n.localize("cd10.sheet.newItem"),
            type: element.dataset.type,
        };

        return this.actor.createEmbeddedDocuments("Item", [itemData]);
    }

    _onItemEdit(event) {
        event.preventDefault();

        let element = event.currentTarget;
        let itemId = element.closest(".item").dataset.itemId;
        let item = this.actor.items.get(itemId);

        item.sheet.render(true);
    }

    _onItemDelete(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let itemId = element.closest(".item").dataset.itemId;

        return this.actor.deleteEmbeddedDocuments("Item", [itemId]);
    }

    async _onSkillEdit(event) {
        event.preventDefault();

        if (!this.isEditable) {
            return;
        }

        const element = event.currentTarget;
        const itemId = element.closest(".item").dataset.itemId;
        const item = this.actor.items.get(itemId);
        const field = element.dataset.field;

        /* DEBUG */
        console.log("ItemId:", event.currentTarget.closest(".item").dataset.itemId);
        console.log("Dataset class: ", event.currentTarget.closest(".item").dataset);
        console.log("Actor items: ", this.actor.items);
        console.log("Contents of 'item'", item);
        console.log("Contents of 'field'", field);

        await item.update({
            [field]: element.value
        });
    }
}