export default class CD10NamedCharacterSheet extends ActorSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: "systems/cd10_dev/templates/sheets/namedCharacter-sheet.hbs",
            classes: ["cd10", "sheet", "namedCharacter"],
            tabs: [{
                navSelector: ".sheet-tabs",
                contentSelector: ".sheet-body",
                initial: "biography"
            }]
        });
    }

    get template() {
        return `systems/cd10_dev/templates/sheets/namedCharacter-sheet.hbs`;
    }



    equippableItemContextMenu = [{
            name: game.i18n.localize("cd10.sheet.edit"),
            icon: '<i class="fas fa-edit"></i>',
            callback: element => {
                const itemId = element.data("item-id");
                const item = this.actor.items.get(itemId);

                item.sheet.render(true);
            }
        },
        {

            name: game.i18n.localize("cd10.sheet.equip"),
            icon: '<i class="far fa-caret-square-up"></i>',

            callback: element => {
                const itemId = element.data("item-id");
                const item = this.actor.items.get(itemId);
                let boolValue = false

                if (item.data.data.isEquipped.value) {
                    boolValue = false;
                } else {
                    boolValue = true;
                }

                item.update({
                    data: {
                        isEquipped: {
                            value: boolValue
                        }
                    }
                });
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


    async getData() {
        /* Override default getData() function */
        let sheetData = super.getData();
        sheetData.config = CONFIG.cd10;
        sheetData.data = sheetData.data.data;

        /* Sort items alphabetically */
        sheetData.items.sort(function(a, b) {
            return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        })

        /* Create subproperties for item types */
        sheetData.ammunition = sheetData.items.filter(p => p.type == "ammunition");
        sheetData.allArmors = sheetData.items.filter(p => p.type == "armor");
        sheetData.armors = sheetData.items.filter(p => p.type == "armor" && !p.data.isShield.value);
        sheetData.shields = sheetData.items.filter(p => p.type == "armor" && p.data.isShield.value);
        sheetData.allWeapons = sheetData.items.filter(p => p.type == "weapon");
        sheetData.meleeWeapons = sheetData.items.filter(p => p.type == "weapon" && !p.data.isRanged.value);
        sheetData.rangedWeapons = sheetData.items.filter(p => p.type == "weapon" && p.data.isRanged.value);
        sheetData.skills = sheetData.items.filter(p => p.type == "skill");
        sheetData.traits = sheetData.items.filter(p => p.type == "trait");
        sheetData.spells = sheetData.items.filter(p => p.type == "spell");
        sheetData.normalItems = sheetData.items.filter(p => p.type != "spell" && p.type != "skill" && p.type != "trait");

        return sheetData;
    }

    activateListeners(html) {
        html.find(".item-create").click(this._onItemCreate.bind(this));
        html.find(".inline-edit").change(this._onSkillEdit.bind(this));
        html.find(".item-delete").click(this._onItemDelete.bind(this));
        html.find(".item-equip").click(this._onItemEquip.bind(this));
        html.find('.shock-icons').on("click contextmenu", this._onShockMarkChange.bind(this));
        html.find('.wounds-icons').on("click contextmenu", this._onWoundsMarkChange.bind(this));

        new ContextMenu(html, ".weapon-card", this.equippableItemContextMenu);
        new ContextMenu(html, ".armor-card", this.equippableItemContextMenu);
        new ContextMenu(html, ".equippable-inventory-item", this.equippableItemContextMenu);
        new ContextMenu(html, ".inventory-item", this.itemContextMenu);

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

        this._updateEncumbrance();
    }

    async _onItemDelete(event) {
        event.preventDefault();

        let element = event.currentTarget;
        let itemId = element.closest(".item").dataset.itemId;
        const item = this.actor.items.get(itemId);

        await this.actor.deleteEmbeddedDocuments("Item", [itemId]);
        if (item.type == "trait") {
            this._updateTotalTraitValue();
        }

        this._updateEncumbrance();

    }

    async _onItemEquip(event) {
        event.preventDefault();

        let element = event.currentTarget;
        let itemId = element.closest(".item").dataset.itemId;
        const item = this.actor.items.get(itemId);

        let boolValue = false
        if (item.data.data.isEquipped.value) {
            boolValue = false;
        } else {
            boolValue = true;
        }

        await item.update({
            data: {
                isEquipped: {
                    value: boolValue
                }
            }
        });

        this._updateEncumbrance();
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

        if (item.type == "trait") {
            this._updateTotalTraitValue();
        }
    }

    async _onShockMarkChange(event) {
        event.preventDefault();
        let currentCount = this.actor.data.data.shock.value;
        let newCount;

        if (event.type == "click") {
            newCount = Math.min(currentCount + 1, this.actor.data.data.shock.max);
        } else {
            newCount = Math.max(currentCount - 1, 0);
        }

        await this.actor.update({
            "data.shock.value": newCount
        });

        this._setDebilitation("Shock", newCount);
    }

    async _onWoundsMarkChange(event) {
        event.preventDefault();
        let currentCount = this.actor.data.data.wounds.value;
        let newCount;

        if (event.type == "click") {
            newCount = Math.min(currentCount + 1, this.actor.data.data.wounds.max);
        } else {
            newCount = Math.max(currentCount - 1, 0);
        }

        await this.actor.update({
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
                "data.modifier.value": 0,
                "data.debilitationType.value": ""
            })
            return
        }

        let newModifier = shockModifier + woundsModifier;

        this.actor.update({
            "data.modifier.value": parseInt(newModifier),
            "data.debilitationType.value": debilitationType
        });
    }

    async _updateTotalTraitValue() {

        const totalItems = this.actor.items;
        let totalTraits;
        let totalValue = 0;

        totalTraits = totalItems.filter(trait => trait.type === 'trait');

        for (let i = 0; i < totalTraits.length; i++) {
            let adder = 0;
            adder = +parseInt(totalTraits[i].data.data.skillLevel.value);

            totalValue += adder;
        }

        await this.actor.update({
            "data.totalTraitValue.value": parseInt(totalValue)
        });
    }

    async _updateEncumbrance() {
        let encumbranceValue = 0;
        let itemList = this.actor.items.filter(p => p.type != "spell" && p.type != "skill" && p.type != "trait");

        for (let i = 0; i < itemList.length; i++) {
            let adder = 0;

            if (itemList[i].type == "armor" || itemList[i].type == "weapon" && itemList[i].data.data.isEquipped.value == true) {
                adder = +parseFloat(itemList[i].data.data.weight.value / 2);
            } else {
                adder = +parseFloat(itemList[i].data.data.weight.value);
            }
            encumbranceValue += adder;
        }

        await this.actor.update({
            "data.encumbrance.value": parseFloat(encumbranceValue)
        });
    }

    async _onDropItemCreate(itemData) {
        const rv = await super._onDropItemCreate(itemData);
        this._updateEncumbrance()
        return rv;
    }
}