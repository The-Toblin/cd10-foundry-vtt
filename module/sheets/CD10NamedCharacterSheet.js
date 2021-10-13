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

    itemContextMenu = [{
            name: game.i18n.localize("cd10.sheet.edit"),
            icon: '<i class="fas fa-edit"></i>',
            callback: element => {
                const itemId = element.data("item-id");
                const item = this.actor.items.get(itemId);
                item.sheet.render(true);
            }
        },
        {
            name: game.i18n.localize("cd10.sheet.remove"),
            icon: '<i class="fas fa-trash"></i>',
            callback: element => {
                this.actor.deleteEmbeddedDocuments("Item", [element.data("item-id")]);
            }
        }
    ];

    getData() {
        /* Override default getData() function */
        let sheetData = super.getData();
        sheetData.config = CONFIG.cd10;
        sheetData.data = sheetData.data.data;

        /* Sort items alphabetically */
        sheetData.items.sort(function(a, b) {
            return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        })

        /* Create subproperties for item types */
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

        return sheetData;
    }

    activateListeners(html) {
        html.find(".item-create").click(this._onItemCreate.bind(this));
        html.find(".inline-edit").change(this._onSkillEdit.bind(this));
        html.find(".item-delete").click(this._onItemDelete.bind(this));
        html.find('.shock-icons').on("click contextmenu", this._onShockMarkChange.bind(this));
        html.find('.wounds-icons').on("click contextmenu", this._onWoundsMarkChange.bind(this));

        new ContextMenu(html, ".weapon-card", this.itemContextMenu);
        new ContextMenu(html, ".armor-card", this.itemContextMenu);

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

    async _onItemDelete(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let itemId = element.closest(".item").dataset.itemId;

        await this.actor.deleteEmbeddedDocuments("Item", [itemId]);
        this._updateTotalTraitValue();

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

        await item.update({
            [field]: element.value
        });

        this._updateTotalTraitValue();
    }

    _onShockMarkChange(event) {
        event.preventDefault();
        let currentCount = this.actor.data.data.shock.value;
        let newCount;

        if (event.type == "click") {
            newCount = Math.min(currentCount + 1, 15);
        } else {
            newCount = Math.max(currentCount - 1, 0);
        }

        this.actor.update({
            "data.shock.value": newCount
        });

        this._setDebilitation("Shock", newCount);
    }

    _onWoundsMarkChange(event) {
        event.preventDefault();
        let currentCount = this.actor.data.data.wounds.value;
        let newCount;

        if (event.type == "click") {
            newCount = Math.min(currentCount + 1, 15);
        } else {
            newCount = Math.max(currentCount - 1, 0);
        }

        this.actor.update({
            "data.wounds.value": newCount
        });

        this._setDebilitation("Wounds", newCount);
    }

    _setDebilitation(type, updateValue) {

        /* This function calculates the proper debilitation for a character */
        let debilitationType;
        let currentShock = this.actor.data.data.shock.value;
        let currentWounds = this.actor.data.data.wounds.value;

        if (type == "Shock") {
            currentShock = +updateValue;
        } else {
            currentWounds = +updateValue;
        }

        let shockModifier = currentShock;
        let woundsModifier = 0;

        if (currentWounds == 2) {
            woundsModifier = 1;
            debilitationType = "on physical checks";
        } else if (currentWounds == 3) {
            woundsModifier = 2;
            debilitationType = "on physical checks";
        } else if (currentWounds > 3 && currentWounds < 6) {
            woundsModifier = 3;
            debilitationType = "on physical checks";
        } else if (currentWounds > 5 && currentWounds < 8) {
            woundsModifier = 4;
            debilitationType = "on all checks";
        } else if (currentWounds > 6 && currentWounds < 10) {
            woundsModifier = 5;
            debilitationType = "on all checks";
        } else if (currentWounds == 10) {
            woundsModifier = 6;
            debilitationType = "on all checks";
        } else if (currentWounds == 11) {
            woundsModifier = 7;
            debilitationType = "on all checks. DC 3.";
        } else if (currentWounds == 12) {
            woundsModifier = 7;
            debilitationType = "on all checks. DC 6.";
        } else if (currentWounds == 13) {
            woundsModifier = 8;
            debilitationType = "on all checks. DC 9.";
        } else if (currentWounds == 14) {
            woundsModifier = 8;
            debilitationType = "on all checks. DC 12.";
        } else if (currentWounds == 15) {
            woundsModifier = 10;
            debilitationType = "You are dead!";
        } else {
            woundsModifier = 0;
            debilitationType = "on physical checks";
        }

        if (currentShock == 0 && currentWounds < 2) {
            this.actor.update({
                "data.modifier": 0,
                "data.debilitationType": ""
            })
            return
        }

        let newModifier = shockModifier + woundsModifier;

        this.actor.update({
            "data.modifier": newModifier,
            "data.debilitationType": debilitationType
        })
    }

    _updateTotalTraitValue() {

        const totalItems = this.actor.items;
        let totalTraits;
        let totalValue = 0;

        totalTraits = totalItems.filter(trait => trait.type === 'trait');

        console.log(totalTraits);

        for (let i = 0; i < totalTraits.length; i++) {
            let adder = 0;
            adder = +parseInt(totalTraits[i].data.data.skillLevel);

            totalValue += adder;
        }

        this.actor.update({
            "data.totalTraitValue": totalValue
        })

    }
}