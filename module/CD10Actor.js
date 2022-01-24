export default class CD10Actor extends Actor {
    prepareData() {
        super.prepareData();
    }

    prepareBaseData() {}

    prepareDerivedData() {
        const actorData = this.data;
        const templateData = this.data.data;

        /* Encumbrance */
        templateData.currentEncumbrance = {
            type: "number",
            label: "Encumbrance",
            value: this._prepareEncumbrance(actorData),
        };

        /* Update Traits totals */
        let traits = this._prepareTraits(actorData);

        templateData.traitsValue = {
            type: "number",
            label: "Total traits value",
            value: traits.totalValue,
        };

        templateData.posTraits = {
            type: "number",
            label: "Total positive traits",
            value: traits.pos,
        };

        templateData.negTraits = {
            type: "number",
            label: "Total negative traits",
            value: traits.neg,
        };

        /* Set debilitationtype and value */
        let debilitation = this._prepareDebilitation(templateData);

        /* Check stress and apply to modifier */
        if (templateData.stressing.value) {
            debilitation.modifier += 3;
        }

        templateData.modifier = {
            type: "number",
            label: "Modifier",
            value: debilitation.modifier
        };

        templateData.debilitationType = {
            type: "string",
            label: "Debilitation",
            value: debilitation.type,
        };
    }

    /***********
     *         *
     * Getters *
     *         *
     **********/

    get getSkills() {
        return this.data.items.filter((p) => p.data.type == "skill");
    }

    get getSpells() {
        return this.data.items.filter((p) => p.data.type == "spell");
    }

    get getTraits() {
        return this.data.items.filter((p) => p.data.type == "trait");
    }

    get getArmors() {
        return this.data.items.filter(
            (p) => p.data.type == "armor" && !p.data.data.isShield.value
        );
    }

    get getShields() {
        return this.data.items.filter(
            (p) => p.data.type == "armor" && p.data.data.isShield.value
        );
    }

    get getMeleeWeapons() {
        return this.data.items.filter(
            (p) => p.data.type == "weapon" && !p.data.data.isRanged.value
        );
    }

    get getRangedWeapons() {
        return this.data.items.filter(
            (p) => p.data.type == "weapon" && p.data.data.isRanged.value
        );
    }

    get getShock() {
        return parseInt(this.data.data.shock.value);
    }

    get getWounds() {
        return parseInt(this.data.data.wounds.value);
    }

    get getModifier() {
        return parseInt(this.data.data.modifier.value);
    }

    get getDebilitationType() {
        return this.data.data.debilitationType.value;
    }

    get getExp() {
        return parseInt(this.data.data.exp.total);
    }

    /**************************
     *                        *
     * Custom prepare methods *
     *                        *
     *************************/

    _prepareEncumbrance(data) {
        let encumbranceValue = 0;
        let itemList = data.items.filter(
            (p) => p.type != "spell" && p.type != "skill" && p.type != "trait"
        );

        for (let i = 0; i < itemList.length; i++) {
            let adder = 0;

            if (
                (itemList[i].type == "armor" &&
                    itemList[i].data.data.isEquipped.value == true) ||
                (itemList[i].type == "weapon" &&
                    itemList[i].data.data.isEquipped.value == true)
            ) {
                adder = +parseFloat(itemList[i].data.data.weight.value / 2);
            } else {
                adder = +parseFloat(itemList[i].data.data.weight.value);
            }

            encumbranceValue += adder;
        }
        return encumbranceValue;
    }

    _prepareTraits(data) {
        let totalValue = 0,
            pos = 0,
            neg = 0;

        let totalTraits = data.items.filter((trait) => trait.type === "trait");

        for (let i = 0; i < totalTraits.length; i++) {
            let adder = 0;
            adder = +parseInt(totalTraits[i].data.data.skillLevel.value);

            totalValue += adder;
        }

        totalTraits.forEach((p) => {
            if (p.data.data.skillLevel.value > 0) {
                ++pos;
            } else {
                ++neg;
            }
        });

        return {
            "totalValue": totalValue,
            "pos": pos,
            "neg": neg
        }
    }

    _prepareDebilitation(data) {
        /* This function calculates the proper modifier and debilitation type for a character */
        let debilitationType,
            wounds = data.wounds.value,
            woundsModifier;

        if (wounds == 2) {
            woundsModifier = 1;
            debilitationType = game.i18n.localize("cd10.injuries.debilitation.physOnly");
        } else if (wounds == 3) {
            woundsModifier = 2;
            debilitationType = game.i18n.localize("cd10.injuries.debilitation.physOnly");
        } else if (wounds > 3 && wounds < 6) {
            woundsModifier = 3;
            debilitationType = game.i18n.localize("cd10.injuries.debilitation.physOnly");
        } else if (wounds > 5 && wounds < 8) {
            woundsModifier = 4;
            debilitationType = game.i18n.localize("cd10.injuries.debilitation.all");
        } else if (wounds > 6 && wounds < 10) {
            woundsModifier = 5;
            debilitationType = game.i18n.localize("cd10.injuries.debilitation.all");
        } else if (wounds == 10) {
            woundsModifier = 6;
            debilitationType = game.i18n.localize("cd10.injuries.debilitation.all");
        } else if (wounds == 11) {
            woundsModifier = 7;
            debilitationType = game.i18n.localize("cd10.injuries.debilitation.all") + " " + game.i18n.localize("cd10.sheet.difficultyShort") + " 3";
        } else if (wounds == 12) {
            woundsModifier = 7;
            debilitationType = game.i18n.localize("cd10.injuries.debilitation.all") + " " + game.i18n.localize("cd10.sheet.difficultyShort") + " 6";
        } else if (wounds == 13) {
            woundsModifier = 8;
            debilitationType = game.i18n.localize("cd10.injuries.debilitation.all") + " " + game.i18n.localize("cd10.sheet.difficultyShort") + " 9";
        } else if (wounds == 14) {
            woundsModifier = 8;
            debilitationType = game.i18n.localize("cd10.injuries.debilitation.all") + " " + game.i18n.localize("cd10.sheet.difficultyShort") + " 12";
        } else if (wounds == 15) {
            woundsModifier = 8;
            debilitationType = game.i18n.localize("cd10.injuries.debilitation.dead");
        } else {
            woundsModifier = 0;
            debilitationType = game.i18n.localize("cd10.injuries.debilitation.physOnly");
        }

        if (data.shock.value == 0 && wounds < 2) {
            woundsModifier = 0;
            debilitationType = "";
        }

        return {
            "modifier": data.shock.value + woundsModifier,
            "type": debilitationType
        }
    }

    async modifyExp(amount) {
        if (typeof amount != "number") {
            ui.notifications.error(`Not a number for Exp update!`);
            return;
        }
        let currentExp = this.getExp,
            newExp = currentExp + amount;

        await this.update({
            "data.exp.total": newExp

        });
    }

    async modifyWounds(amount) {
        if (typeof amount != "number") {
            ui.notifications.error(`Not a number for wounds update!`);
            return;
        }
        let currentWounds = this.getWounds,
            newWounds;

        if (amount > 0) {
            newWounds = Math.min(currentWounds + amount, this.data.data.wounds.max);
        } else if (amount < 0) {
            newWounds = Math.max(currentWounds - 1, 0);
        }

        await this.update({
            "data.wounds.value": newWounds
        });
    }

    async modifyShock(amount) {
        if (typeof amount != "number") {
            ui.notifications.error(`Not a number for shock update!`);
            return;
        }
        let currentShock = this.getShock,
            newShock;

        if (amount > 0) {
            newShock = Math.min(currentShock + amount, this.data.data.shock.max);
        } else if (amount < 0) {
            newShock = Math.max(currentShock - 1, 0);
        }

        await this.update({
            "data.shock.value": newShock
        });
    }
}