export default class CD10Item extends Item {

  chatTemplate = {
    meleeWeapon: "systems/cd10/templates/partials/equipment-cards/meleeWeapon-card.hbs",
    rangedWeapon: "systems/cd10/templates/partials/equipment-cards/rangedWeapon-card.hbs",
    armor: "systems/cd10/templates/partials/equipment-cards/armor-card.hbs",
    skill: "systems/cd10/templates/partials/skill-card.hbs",
    trait: "systems/cd10/templates/partials/skill-card.hbs",
    spell: "systems/cd10/templates/partials/skill-card.hbs"
  };

  prepareDerivedData() {
    this.system.id = this.id;
  }

  async _preCreate(data, options, user) {
    /* Hijack preCreate to create a matchID for items that is persistent across characters.
        This is mainly used to match weapons with their combat skills. */

    if (!this.isEmbedded && this.type === "skill") {
      if (typeof this.system.matchID === "undefined" || this.system.matchID === "") {
        const updateData = {};
        const matchID = randomID();

        updateData["system.matchID"] = matchID;

        this.updateSource(updateData);
      }
    }

    return await super._preCreate(data, options, user);
  }

  static async create(data, options) {
    return await super.create(data, options);
  }

  async roll() {
    let chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker()
    };

    let cardData = {
      ...this,
      owner: this.actor.id
    };

    chatData.content = await renderTemplate(
      this.chatTemplate[this.type],
      cardData
    );

    return ChatMessage.create(chatData);
  }

  /**
   * Function to make this item equipped, or to unequip it, to an actor. Only acts on equipment.
   */
  async equip() {
    const sys = this.actor.system;
    const type = this.type === "meleeWeapon" || this.type === "rangedWeapon" ? "weapon" : this.type;
    const updateData = {};

    if (type === "weapon" || type === "armor" || type === "shield") {
      updateData[`system.gear.${type}`] = sys.gear[type] !== this.id ? this.id : null;
      await this.actor.update(updateData);
    }
  }

  async setSelection(actor, reversed) {
    if (this.type !== "trait") return;

    await actor.update({
      "system.selectedTrait": {value: this, reversed: reversed}
    });
  }
}
