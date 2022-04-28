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
      value: traits.totalValue
    };

    templateData.posTraits = {
      type: "number",
      label: "Total positive traits",
      value: traits.pos
    };

    templateData.negTraits = {
      type: "number",
      label: "Total negative traits",
      value: traits.neg
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
      value: debilitation.type
    };
  }

  /** *********
   *         *
   * Getters *
   *         *
   **********/

  get getSkills() {
    return this.data.items.filter(p => p.data.type === "skill");
  }

  get getSpells() {
    return this.data.items.filter(p => p.data.type === "spell");
  }

  get getTraits() {
    return this.data.items.filter(p => p.data.type === "trait");
  }

  get getArmors() {
    return this.data.items.filter(p => p.data.type === "armor");
  }

  get getShields() {
    return this.data.items.filter(p => p.data.type === "shield");
  }

  get getMeleeWeapons() {
    return this.data.items.filter(p => p.data.type === "meleeWeapon");
  }

  get getRangedWeapons() {
    return this.data.items.filter(p => p.data.type === "rangedWeapon");
  }

  get getWounds() {
    return parseInt(this.data.data.wounds.value);
  }

  get getModifier() {
    return parseInt(this.data.data.modifier.value);
  }

  get getExp() {
    return this.type === "named" ? parseInt(this.data.data.exp.total) : 0;
  }

  get getStress() {
    return this.data.data.stressing.value;
  }

  /** ************************
   *                        *
   * Custom prepare methods *
   *                        *
   *************************/

  _prepareTraits(data) {
    let totalValue = 0;
    let pos = 0;
    let neg = 0;

    let totalTraits = data.items.filter(trait => trait.type === "trait");

    for (let i = 0; i < totalTraits.length; i++) {
      let adder = 0;
      adder = +parseInt(totalTraits[i].data.data.skillLevel.value);

      totalValue += adder;
    }

    totalTraits.forEach(p => {
      if (p.data.data.skillLevel.value > 0) {
        ++pos;
      } else {
        ++neg;
      }
    });

    return {
      totalValue: totalValue,
      pos: pos,
      neg: neg
    };
  }

  _prepareDebilitation(data) {
    /* This function calculates the proper modifier and debilitation type for a character */
    const wounds = data.wounds.value;
    const woundsModifier = Math.floor(wounds / 2);

    const physChecks = "on physical checks.";
    const allChecks = "on all checks.";
    const options = {
      2: `${physChecks}`,
      3: `${physChecks}`,
      4: `${physChecks}`,
      5: `${physChecks}`,
      6: `${allChecks}`,
      7: `${allChecks}`,
      8: `${allChecks}`,
      9: `${allChecks}`,
      10: `${allChecks}`,
      11: `${allChecks} DC 3.`,
      12: `${allChecks} DC 6.`,
      13: `${allChecks} DC 9.`,
      14: `${allChecks} DC 12.`,
      15: "You are dead!"
    };

    let debilitationType = `${options[wounds] || ""}`;

    return {
      modifier: woundsModifier,
      type: debilitationType
    };
  }

  async modifyExp(amount) {
    if (typeof amount !== "number") {
      ui.notifications.error("Not a number for Exp update!");
      return;
    }
    let currentExp = this.getExp;
    let newExp = currentExp + amount;

    await this.update({
      "data.exp.total": newExp
    });
  }

  async modifyWounds(amount) {
    if (typeof amount !== "number") {
      ui.notifications.error("Not a number for wounds update!");
      return;
    }
    let currentWounds = this.getWounds;
    let newWounds;

    if (amount > 0) {
      newWounds = Math.min(currentWounds + amount, this.data.data.wounds.max);
    } else if (amount < 0) {
      newWounds = Math.max(currentWounds - 1, 0);
    }

    await this.update({
      "data.wounds.value": newWounds
    });
  }

  async resetTraitSelection() {
    let traitArray = [];

    this.getTraits.forEach(t => {
      const itemUpdate = {
        _id: t.id,
        data: {
          selected: 0
        }
      };
      traitArray.push(itemUpdate);
    });

    await this.updateEmbeddedDocuments("Item", traitArray);
  }

  async unequipItems(item) {
    let itemArray = [];
    let itemUpdate = {};
    let itemtype = item.match(/Weapon/) ? "weapon" : "armor";

    for (const i of this.items) {
      if (i.type.match(/Weapon/) && itemtype === "weapon") {
        itemUpdate = {
          _id: i.id,
          data: {
            isEquipped: {
              value: false
            }
          }
        };
        if (Object.keys(itemUpdate).length > 1) itemArray.push(itemUpdate);
      } else if (i.type === item) {
        itemUpdate = {
          _id: i.id,
          data: {
            isEquipped: {
              value: false
            }
          }
        };
        if (Object.keys(itemUpdate).length > 1) {
          itemArray.push(itemUpdate);
        }
      }
      await this.updateEmbeddedDocuments("Item", itemArray);
    }
  }

  async toggleStress(value) {
    this.update({
      data: {
        stressing: {
          value: value
        }
      }
    });
  }
}
