import * as Dice from "../dice.js";

export default class CD10NamedCharacterSheet extends ActorSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: "systems/cd10/templates/sheets/namedCharacter-sheet.hbs",
            classes: [
                "cd10", "sheet", "namedCharacter"
            ],
            tabs: [{
                navSelector: ".sheet-tabs",
                contentSelector: ".sheet-body",
                initial: "biography"
            }, ]
        });
    }

    get template() {
        return `systems/cd10/templates/sheets/namedCharacter-sheet.hbs`;
    }

    /* Define ContextMenus */
    equippableItemContextMenu = [{
        name: game.i18n.localize("cd10.sheet.edit"),
        icon: '<i class="fas fa-edit"></i>',
        callback: (element) => {
            const itemId = element.data("item-id");
            const item = this.actor.items.get(itemId);

            item.sheet.render(true);
        }
    }, {
        name: game.i18n.localize("cd10.sheet.equip"),
        icon: '<i class="far fa-caret-square-up"></i>',

        callback: (element) => {
            const itemId = element.data("item-id");
            const item = this.actor.items.get(itemId);
            let boolValue = false;

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
    }, {
        name: game.i18n.localize("cd10.sheet.remove"),
        icon: '<i class="fas fa-trash"></i>',
        callback: (element) => {
            this.actor.deleteEmbeddedDocuments("Item", [element.data("item-id")]);
        }
    }, ];

    itemContextMenu = [{
        name: game.i18n.localize("cd10.sheet.edit"),
        icon: '<i class="fas fa-edit"></i>',
        callback: (element) => {
            const itemId = element.data("item-id");
            const item = this.actor.items.get(itemId);

            item.sheet.render(true);
        }
    }, {
        name: game.i18n.localize("cd10.sheet.remove"),
        icon: '<i class="fas fa-trash"></i>',
        callback: (element) => {
            this.actor.deleteEmbeddedDocuments("Item", [element.data("item-id")]);
        }
    }, ];

    getData() {
        /* Override default getData() function */
        let sheetData = super.getData();
        sheetData.config = CONFIG.cd10;
        sheetData.data = sheetData.data.data;

        /* Sort items alphabetically */
        sheetData.items.sort(function(a, b) {
            return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        });

        /* Create subproperties for item types */
        sheetData.ammunition = sheetData.items.filter((p) => p.type == "ammunition");
        sheetData.allArmors = sheetData.items.filter((p) => p.type == "armor");
        sheetData.armors = sheetData.items.filter((p) => p.type == "armor" && !p.data.isShield.value);
        sheetData.shields = sheetData.items.filter((p) => p.type == "armor" && p.data.isShield.value);
        sheetData.allWeapons = sheetData.items.filter((p) => p.type == "weapon");
        sheetData.meleeWeapons = sheetData.items.filter((p) => p.type == "weapon" && !p.data.isRanged.value);
        sheetData.rangedWeapons = sheetData.items.filter((p) => p.type == "weapon" && p.data.isRanged.value);
        sheetData.skills = sheetData.items.filter((p) => p.type == "skill");
        sheetData.traits = sheetData.items.filter((p) => p.type == "trait");
        sheetData.posTraits = sheetData.traits.filter((p) => {
            if (p.data.skillLevel.value > 0) {
                return p
            }
        });
        sheetData.negTraits = sheetData.traits.filter((p) => {
            if (p.data.skillLevel.value < 0) {
                return p
            }
        });
        sheetData.spells = sheetData.items.filter((p) => p.type == "spell");
        sheetData.normalItems = sheetData.items.filter((p) => p.type != "spell" && p.type != "skill" && p.type != "trait");

        return sheetData;
    }

    activateListeners(html) {
        /* Owner-only listeners */
        if (this.actor.isOwner) {
            /*html.find(".item-roll").click(this._onItemRoll.bind(this));*/
            html.find(".task-check").click(this._onTaskCheck.bind(this));
            html.find(".attack-check").click(this._simpleAttackCheck.bind(this));
            html.find(".reveal-rollable").on("mouseover mouseout", this._onToggleRollable.bind(this));
            html.find(".complex-check").click(this._onComplexCheck.bind(this));
            html.find(".stressBox").click(this._stressBoxClicked.bind(this));
        }

        /* General listeners */
        /*html.find(".item-create").click(this._onItemCreate.bind(this));*/
        html.find(".inline-edit").change(this._onSkillEdit.bind(this));
        html.find(".item-delete").click(this._onItemDelete.bind(this));
        html.find(".item-equip").click(this._onItemEquip.bind(this));
        html.find(".shock-icons").on("click contextmenu", this._onShockMarkChange.bind(this));
        html.find(".wounds-icons").on("click contextmenu", this._onWoundsMarkChange.bind(this));

        /* ContextMenu listeners */
        new ContextMenu(html, ".weapon-card", this.equippableItemContextMenu);
        new ContextMenu(html, ".armor-card", this.equippableItemContextMenu);
        new ContextMenu(html, ".equippable-inventory-item", this.equippableItemContextMenu);
        new ContextMenu(html, ".inventory-item", this.itemContextMenu);

        super.activateListeners(html);
    }

    /***************************
     * Various checks and saves *
     ***************************/

    async _onTaskCheck(event) {
        /* Method to handle a simple skill check. */
        event.preventDefault();

        /* If a hero point is spent, check if there's enough points.
        Otherwise cancel the check. */
        if (event.shiftKey) {
            if (this._checkHeroPoints() === false) {
                return
            }
        }

        /* Fetch the skill, based on ItemId. */
        let skillObj = this.actor.items.get(event.currentTarget.closest(".item").dataset.itemId);

        /* Dump the skill description to chat. */
        skillObj.roll()

        /* Perform the check */
        Dice.TaskCheck({
            checkType: "Simple",
            skillObj: skillObj.data,
            modifier: this.actor.getModifier,
            heroPoint: event.shiftKey
        });
    }

    async _simpleAttackCheck(event) {
        /* Attack check performed by left-clicking a damage value on a weapon card */
        event.preventDefault();

        /* If a hero point is spent, check if there's enough points. */
        if (event.shiftKey) {
            if (this._checkHeroPoints() === false) {
                return
            }
        }

        const damageType = event.currentTarget.dataset.damageType,
            weaponObj = this.actor.items.get(event.currentTarget.closest(".item").dataset.itemId).data,
            attackSkill = weaponObj.data.attackSkill.value,
            shieldSkill = weaponObj.data.shieldSkill.value;

        let usingShield = false,
            attackSkillObj = null,
            shieldSkillObj = null;

        /* Fetch the actor skills and prepare them for comparison. Due
        to config limitations, skills are stored as punctuation-less
        variables in the config file, but the skill names are regular
        text. This function turns the freely-typed skills into space-less,
        punctuation-less strings for comparison. 
        */

        if (shieldSkill === "None") {
            this.getData().skills.forEach((skill) => {
                let punctuationless = skill.name.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
                let finalString = punctuationless.replace(/\s+/g, '').toLowerCase();

                if (finalString === attackSkill.toLowerCase()) {
                    attackSkillObj = skill;
                }
            });
        } else {
            this.getData().skills.forEach((skill) => {
                let punctuationless = skill.name.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
                let finalString = punctuationless.replace(/\s+/g, '').toLowerCase();

                if (finalString === attackSkill.toLowerCase()) {
                    attackSkillObj = skill;
                }
            });

            this.getData().skills.forEach((skill) => {
                let punctuationless = skill.name.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
                let finalString = punctuationless.replace(/\s+/g, '').toLowerCase();

                if (finalString === shieldSkill.toLowerCase()) {
                    shieldSkillObj = skill;
                }
            });
        }

        /* Check if the character has equipped a shield.*/
        let shieldObj = null;
        this.getData().shields.forEach((shield) => {
            if (shield.data.isEquipped.value) {
                usingShield = true;
                shieldObj = shield;
            }
        });

        /* Perform the attack check */
        Dice.TaskCheck({
            checkType: "SimpleAttack",
            skillObj: attackSkillObj,
            shieldSkillObj: shieldSkillObj,
            usingShield: usingShield,
            weaponObj: weaponObj,
            damageType: damageType,
            heroPoint: event.shiftKey,
            modifier: this.actor.getModifier
        });

    }

    async _onComplexCheck(event) {
        /* Open the complex check dialog */
        event.preventDefault();
        let dialogOptions = {
            classes: [
                "cd10-dialog", "complex-check-dialog"
            ],
            top: 300,
            left: 400
        };
        new Dialog({
            title: "Complex Check Dialog",
            content: await renderTemplate("systems/cd10/templates/partials/complex-check-dialog.hbs", this.getData()),
            buttons: {
                complexCheck: {
                    label: "Roll check!",
                    callback: (html) => this._complexSkillCheck(html)
                },
                physicalSave: {
                    label: "Save!",
                    callback: (html) => this._PhysicalSave(html)
                },
                attackCheck: {
                    label: "Attack!",
                    callback: (html) => this._complexAttackCheck(html)
                }
            }
        }, dialogOptions).render(true);
    }

    async _complexSkillCheck(html) {
        /* Perform a complex skill check, complex attack or physical save,
        called from the Complex dialog */

        /* Set up variables for the method */
        let heroPointChecked = html.find("input#heroPoint")[0].checked,
            reverseTraitChecked = html.find("input#reverseTrait")[0].checked,
            skillObj = null,
            posTraitObj = null,
            negTraitObj = null;

        /* Fetch the objects for skills and traits involved*/
        if (html.find("select#skill-selected").val() != "None") {
            skillObj = this.actor.items.get(this.getData().skills[html.find("select#skill-selected").val()]._id);
        }
        if (html.find("select#pos-trait-selected").val() != "None") {
            posTraitObj = this.actor.items.get(this.getData().posTraits[html.find("select#pos-trait-selected").val()]._id);
        }
        if (html.find("select#neg-trait-selected").val() != "None") {
            negTraitObj = this.actor.items.get(this.getData().negTraits[html.find("select#neg-trait-selected").val()]._id);
        }

        /* Check if at least one of the selections were done, else show an error message. */
        if (skillObj === null && posTraitObj === null && negTraitObj === null) {
            ui.notifications.error(`Please select at least one skill or trait!`);

            return
        }

        /* If a hero point is spent, check if there's enough points.
        Otherwise cancel the check. */
        if (heroPointChecked) {
            if (this._checkHeroPoints() === false) {
                return
            }
        }

        let skillObjData = null,
            posTraitObjData = null,
            negTraitObjData = null;

        /* Dump skills and traits to chat. */
        if (skillObj != null) {
            skillObj.roll();
            skillObjData = skillObj.data;
        }
        if (posTraitObj != null) {
            posTraitObj.roll();
            posTraitObjData = posTraitObj.data;
        }
        if (negTraitObj != null) {
            negTraitObj.roll();
            negTraitObjData = negTraitObj.data;
        }

        Dice.TaskCheck({
            checkType: "Complex",
            skillObj: skillObjData,
            posTraitObj: posTraitObjData,
            negTraitObj: negTraitObjData,
            modifier: this.actor.getModifier,
            heroPoint: heroPointChecked,
            reverseTrait: reverseTraitChecked

        });
    }

    async _complexAttackCheck(event) {

    }

    async _PhysicalSave(event) {
        /* Perform a physical save. */
        event.preventDefault();

        let damageType = event.currentTarget.dataset.damageType;
        let armorObj = this.actor.items.get(event.currentTarget.closest(".item").dataset.itemId);

        let dialogOptions = {
            classes: [
                "cd10-dialog", "physical-save-dialog"
            ],
            top: 300,
            left: 400
        };
        new Dialog({
            title: "Physical Save",
            content: await renderTemplate("systems/cd10/templates/partials/physical-save-dialog.hbs", this.getData()),
            buttons: {
                roll: {
                    label: "Roll!",
                    callback: (html) => this._doSaveStuff(html, armorObj, damageType)
                }
            }
        }, dialogOptions).render(true);
    }

    async _doSaveStuff(html, armorObj, damageType) {
        /* Perform a physical save, called from the physical save dialog.
        This function is complex and deals with gathering the data for
        the roll, as well as responding to the result and doing the
        actor updates for wounds and shock. */


        /* First, we check if traits were selected in the dialog or not. */
        let rollTraitLevel,
            outcome;
        if (html.find("select#pos-trait-selected").val() != "None" && html.find("select#neg-trait-selected").val() != "None") {
            let posTraitLevel = this.getData().traits[html.find("select#pos-trait-selected").val()].data.skillLevel.value;
            let negTraitLevel = this.getData().traits[html.find("select#neg-trait-selected").val()].data.skillLevel.value;
            rollTraitLevel = posTraitLevel - negTraitLevel;
        } else if (html.find("select#pos-trait-selected").val() != "None") {
            rollTraitLevel = this.getData().traits[html.find("select#pos-trait-selected").val()].data.skillLevel.value;
        } else if (html.find("select#neg-trait-selected").val() != "None") {
            rollTraitLevel = this.getData().traits[html.find("select#neg-trait-selected").val()].data.skillLevel.value;
        } else {
            rollTraitLevel = null
        }

        /* Check if any of the checkboxes were ticked, as well as gather
        lethality and shock data values. */
        let heroPointChecked = html.find("input#heroPoint")[0].checked,
            reverseTraitChecked = html.find("input#reverseTrait")[0].checked,
            lethality = html.find("input#lethality").val(),
            shock = html.find("input#shock").val();


        /* Once we have the values, we perform either a hero point save
        or a regular save, saving the returned data in 'outcome'. */
        if (heroPointChecked && this.actor.getExp > 0) {
            let expValue = this.actor.getExp - 1;
            await this.actor.update({
                data: {
                    exp: {
                        total: expValue
                    }
                }
            });
            outcome = Dice.PhysicalSave({
                traitValue: rollTraitLevel,
                heroPoint: heroPointChecked,
                reverseTrait: reverseTraitChecked,
                armor: armor,
                damageType: damageType,
                lethality: lethality,
                shock: shock
            });
        } else if (!heroPointChecked) {
            outcome = Dice.PhysicalSave({
                traitValue: rollTraitLevel,
                heroPoint: false,
                reverseTrait: reverseTraitChecked,
                armor: armor,
                damageType: damageType,
                lethality: lethality,
                shock: shock
            });
        } else {
            ui.notifications.error(`${
                this.actor.name
            } does not have enough experience.`)
            return
        }

        /* Create an update value for wounds and shock, as well as do some
        NaN edge-case fixes for shock. */
        let currentShock = this.actor.getShock,
            rollShock = (await outcome).shock,
            newShock = currentShock + rollShock,
            newWounds;

        if (typeof currentShock != "number") {
            console.log("Uh oh, shock was messed up.");
            this.actor.update({
                data: {
                    shock: {
                        value: 0
                    }
                }
            });
        }

        /* Create wounds values for the injury type. */

        if ((await outcome).saveOutcome === "Fumble") {
            newWounds = parseInt(this.actor.getWounds) + parseInt(6);
        } else if ((await outcome).saveOutcome === "Failure" || (await outcome).saveOutcome === "StatusQuo") {
            newWounds = parseInt(this.actor.getWounds) + parseInt(2);
        } else if ((await outcome).saveOutcome === "Success") {
            newWounds = parseInt(this.actor.getWounds) + parseInt(1);
        }

        /* Do not let shock or wounds overflow. */

        if (newShock > this.actor.data.data.shock.max) {
            newShock = this.actor.data.data.shock.max;
        }

        if (newWounds > this.actor.data.data.wounds.max) {
            newWounds = this.actor.data.data.wounds.max;
        }

        /* Make the actual actor update */
        await this.actor.update({
            data: {
                wounds: {
                    value: newWounds
                },
                shock: {
                    value: newShock
                }
            }
        });
    }

    /*
    _onItemRoll(item) {
        item.roll();
    }
    */

    /******************
     * Sheet functions *
     ******************/

    _onToggleRollable(event) {
        /* JS to reveal 'hidden' CSS classes that are marked 'rollable' */
        event.preventDefault();

        const rollables = event.currentTarget.getElementsByClassName("rollable");
        $.each(rollables, function(index, value) {
            $(value).toggleClass("hidden");
        });
    }


    _onItemCreate(event) {
        /* Remnant function for creating items directly on the sheet. Not actively used anymore. */
        event.preventDefault();
        let element = event.currentTarget;

        let itemData = {
            name: game.i18n.localize("cd10.sheet.newItem"),
            type: element.dataset.type
        };

        return this.actor.createEmbeddedDocuments("Item", [itemData]);
    }

    _onItemEdit(event) {
        /* Called when updating items on the sheet */
        event.preventDefault();

        let element = event.currentTarget;
        let itemId = element.closest(".item").dataset.itemId;
        let item = this.actor.items.get(itemId);

        item.sheet.render(true);
    }

    async _onItemDelete(event) {
        /* Enable item deletion from the sheet. */
        event.preventDefault();

        let element = event.currentTarget;
        let itemId = element.closest(".item").dataset.itemId;
        const item = this.actor.items.get(itemId);

        await this.actor.deleteEmbeddedDocuments("Item", [itemId]);
    }

    async _onItemEquip(event) {
        /* Functionality for toggling the isEquipped state of an item */
        event.preventDefault();

        let element = event.currentTarget;
        let itemId = element.closest(".item").dataset.itemId;
        const item = this.actor.items.get(itemId);

        let boolValue = false;
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
        /* Somewhat overengineered function, remnant from when skills and traits
        could be created directly on the character sheet. Now just used to update
        the actual skillLevel. */
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
        /* Listen for changes to Shock and update the value accordingly. */
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
        /* Listen for changes to Wounds and update the value accordingly. */
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

    _stressBoxClicked(event) {
        /* Monitor the stress button and set the stressed status accordingly. */
        event.preventDefault();

        let value = this.actor.data.data.stressing.value;
        if (value) {
            this.actor.update({
                "data.stressing.value": false
            });

        } else if (!value) {
            this.actor.update({
                "data.stressing.value": true
            });
        }
    }
    _checkHeroPoints() {
        if (this.actor.getExp > 0) {
            let expValue = this.actor.getExp - 1;
            this.actor.update({
                data: {
                    exp: {
                        total: expValue
                    }
                }
            });
            return true;
        } else {
            ui.notifications.error(`${
            this.actor.name
        } does not have enough experience.`)
            return false
        }
    }
}