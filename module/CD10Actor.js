export default class CD10Actor extends Actor {
  prepareData() {
    super.prepareData();
  }

  prepareBaseData() {}

  prepareDerivedData() {
    const actorData = this.data;
    const templateData = this.data.data;

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
      value: debilitation.modifier,
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

  get getExp() {
    return parseInt(this.data.data.exp.total);
  }

  get getStress() {
    return this.data.data.stressing.value;
  }

  /**************************
   *                        *
   * Custom prepare methods *
   *                        *
   *************************/

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
      totalValue: totalValue,
      pos: pos,
      neg: neg,
    };
  }

  _prepareDebilitation(data) {
    /* This function calculates the proper modifier and debilitation type for a character */
    let debilitationType,
      wounds = data.wounds.value,
      woundsModifier;

    if (wounds == 2) {
      woundsModifier = 1;
      debilitationType = "on physical checks";
    } else if (wounds == 3) {
      woundsModifier = 2;
      debilitationType = "on physical checks";
    } else if (wounds > 3 && wounds < 6) {
      woundsModifier = 3;
      debilitationType = "on physical checks";
    } else if (wounds > 5 && wounds < 8) {
      woundsModifier = 4;
      debilitationType = "on all checks";
    } else if (wounds > 6 && wounds < 10) {
      woundsModifier = 5;
      debilitationType = "on all checks";
    } else if (wounds == 10) {
      woundsModifier = 6;
      debilitationType = "on all checks";
    } else if (wounds == 11) {
      woundsModifier = 7;
      debilitationType = "on all checks. DC 3.";
    } else if (wounds == 12) {
      woundsModifier = 7;
      debilitationType = "on all checks. DC 6.";
    } else if (wounds == 13) {
      woundsModifier = 8;
      debilitationType = "on all checks. DC 9.";
    } else if (wounds == 14) {
      woundsModifier = 8;
      debilitationType = "on all checks. DC 12.";
    } else if (wounds == 15) {
      woundsModifier = 8;
      debilitationType = "You are dead!";
    } else {
      woundsModifier = 0;
      debilitationType = "on physical checks";
    }

    if (data.shock.value == 0 && wounds < 2) {
      woundsModifier = 0;
      debilitationType = "";
    }

    return {
      modifier: data.shock.value + woundsModifier,
      type: debilitationType,
    };
  }

  async modifyExp(amount) {
    if (typeof amount != "number") {
      ui.notifications.error(`Not a number for Exp update!`);
      return;
    }
    let currentExp = this.getExp,
      newExp = currentExp + amount;

    await this.update({
      "data.exp.total": newExp,
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
      "data.wounds.value": newWounds,
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
      "data.shock.value": newShock,
    });
  }

  async resetTraitSelection() {
    let traitArray = [];

    this.getTraits.forEach((t) => {
      const itemUpdate = {
        _id: t.id,
        data: {
          selected: 0,
        },
      };
      traitArray.push(itemUpdate);
    });

    await this.updateEmbeddedDocuments("Item", traitArray);
    return;
  }

  async unequipItems(item) {
    let itemArray = [],
      itemUpdate = {};

    if (
      item != "meleeWeapon" &&
      item != "rangedWeapon" &&
      item != "armor" &&
      item != "shield"
    ) {
      return;
    } else {
      this.items.forEach((i) => {
        if (i.type === item) {
          itemUpdate = {
            _id: i.id,
            data: {
              isEquipped: {
                value: false,
              },
            },
          };
          if (Object.keys(itemUpdate).length > 1) {
            itemArray.push(itemUpdate);
          }
        }
      });
      await this.updateEmbeddedDocuments("Item", itemArray);
    }
    return;
  }

  async toggleStress(value) {
    this.update({
      data: {
        stressing: {
          value: value,
        },
      },
    });
  }
}
