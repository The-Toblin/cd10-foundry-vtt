import * as Dice from "../dice.js";

export default class CD10MookCharacterSheet extends ActorSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: "systems/cd10/templates/sheets/mookCharacter-sheet.hbs",
            classes: ["cd10", "sheet", "mookCharacter"],
            tabs: [{
                navSelector: ".sheet-tabs",
                contentSelector: ".sheet-body",
                initial: "biography"
            }]
        });
    }

    get template() {
        return `systems/cd10/templates/sheets/mookCharacter-sheet.hbs`;
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
        if (this.actor.isOwner) {
            /*html.find(".item-roll").click(this._onItemRoll.bind(this));*/
            html.find(".task-check").click(this._onTaskCheck.bind(this));
            html.find(".reveal-rollable").on("mouseover mouseout", this._onToggleRollable.bind(this));
        }

        /* General listeners */
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

    _onToggleRollable(event) {
        event.preventDefault();

        const rollables = event.currentTarget.getElementsByClassName("rollable");
        $.each(rollables, function(index, value) {
            $(value).toggleClass("hidden");
        });
    }

    _onItemRoll(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let itemId = element.closest(".item").dataset.itemId;
        let item = this.actor.items.get(itemId);

        item.roll();
    }

    _onTaskCheck(event) {

        Dice.TaskCheck({
            actionValue: event.currentTarget.dataset.actionValue,
            modifier: this.actor.data.data.modifier.value,
        });
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
        const item = this.actor.items.get(itemId);

        await this.actor.deleteEmbeddedDocuments("Item", [itemId]);
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
    }
}