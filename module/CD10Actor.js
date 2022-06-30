export default class CD10Actor extends Actor {
  prepareData() {
    super.prepareData();
  }

  prepareBaseData() {}

  prepareDerivedData() {
    const templateData = this.system;

    /* Update Traits totals */
    let traits = this._prepareTraits(this.items);

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

  get getArmor() {
    return this.system.gear.armor;
  }

  get getShield() {
    return this.system.gear.shield;
  }

  get getMeleeWeapon() {
    return this.system.gear.meleeWeapon;
  }

  get getRangedWeapon() {
    return this.system.gear.rangedWeapon;
  }

  get getWounds() {
    return parseInt(this.system.wounds.value);
  }

  get getModifier() {
    return parseInt(this.system.modifier.value);
  }

  get getExp() {
    return this.type === "named" ? parseInt(this.system.exp.total) : 0;
  }

  get getStress() {
    return this.system.stressing.value;
  }

  /** ************************
   *                        *
   * Custom prepare methods *
   *                        *
   *************************/

  _prepareTraits(items) {
    let totalValue = 0;
    let pos = 0;
    let neg = 0;

    let totalTraits = items.filter(trait => trait.type === "trait");

    for (let i = 0; i < totalTraits.length; i++) {
      let adder = 0;
      adder = +parseInt(totalTraits[i].system.skillLevel.value);

      totalValue += adder;
    }

    totalTraits.forEach(p => {
      if (p.system.skillLevel.value > 0) {
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
      newWounds = Math.min(currentWounds + amount, this.system.wounds.max);
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
