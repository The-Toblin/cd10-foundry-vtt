export default class CD10Actor extends Actor {
  async _preCreate(data, options, user) {
    this.setFlag("cd10", "stressing", false);

    return await super._preCreate(data, options, user);
  }

  prepareData() {
    super.prepareData();
  }

  prepareBaseData() {
    super.prepareBaseData();
  }

  prepareDerivedData() {
    const templateData = this.system;

    /* Create a value to use for tokens */
    templateData.health = {
      value: parseInt(templateData.wounds.max - templateData.wounds.value),
      max: 15,
      min: 0
    };

    /* Update Traits totals */
    const traits = this._prepareTraits(this.items);

    templateData.traitsValue = traits.totalValue;
    templateData.posTraits = traits.pos;
    templateData.negTraits = traits.neg;

    /* Set debilitationtype and value */
    let debilitation = this._prepareDebilitation(templateData);

    debilitation.modifier += this.getFlag("cd10", "stressing") ? 3 : 0;
    templateData.modifier = debilitation.modifier;
    templateData.debilitationType = debilitation.type;
  }

  //  * Getters *

  get getSkills() {
    return this.items.filter(p => p.type === "skill");
  }

  get getSpells() {
    return this.items.filter(p => p.type === "spell");
  }

  get getTraits() {
    return this.items.filter(p => p.type === "trait");
  }

  //   * Custom prepare methods *

  _prepareTraits(items) {
    let totalValue = 0;
    let pos = 0;
    let neg = 0;

    let totalTraits = items.filter(trait => trait.type === "trait");

    for (let i = 0; i < totalTraits.length; i++) {
      let adder = 0;
      adder = +parseInt(totalTraits[i].system.skillLevel);

      totalValue += adder;
    }

    totalTraits.forEach(p => {
      if (p.system.skillLevel > 0) {
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

  _prepareDebilitation(system) {
    /* This function calculates the proper modifier and debilitation type for a character */
    const wounds = system.wounds.value;
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
      "system.exp.total": newExp
    });
  }

  async modifyWounds(isIncrease) {
    const currentWounds = this.system.wounds.value;
    let newWounds;

    if (isIncrease) {
      newWounds = Math.min(currentWounds + 1, this.system.wounds.max);
    } else {
      newWounds = Math.max(currentWounds - 1, this.system.wounds.min);
    }

    await this.update({
      "system.wounds.value": newWounds
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

  async toggleStress() {
    const currentValue = this.getFlag("cd10", "stressing");
    this.setFlag("cd10", "stressing", !currentValue);
  }
}
