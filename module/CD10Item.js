export default class CD10Item extends Item {
  get acceptedAmmoList() {
    return this.actor.sheet.ammoList.filter(
      a => a.system.ammoType === this.system.acceptedAmmo
    );
  }

  get getSelectionStatus() {
    return this.type === "trait" ? this.system.selected : false;
  }

  chatTemplate = {
    meleeWeapon: "systems/cd10/templates/partials/equipment-cards/meleeWeapon-card.hbs",
    rangedWeapon: "systems/cd10/templates/equipment-cards/partials/rangedWeapon-card.hbs",
    armor: "systems/cd10/templates/partials/equipment-cards/armor-card.hbs",
    skill: "systems/cd10/templates/partials/skill-card.hbs",
    trait: "systems/cd10/templates/partials/skill-card.hbs",
    spell: "systems/cd10/templates/partials/skill-card.hbs"
  };

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
      ...this.system,
      owner: this.actor.id
    };

    chatData.content = await renderTemplate(
      this.chatTemplate[this.type],
      cardData
    );
    chatData.roll = true;

    return ChatMessage.create(chatData);
  }

  async setSelectionStatus(status) {
    if (this.type === "trait") {
      if (typeof status !== "number") {
        ui.errors.notifications("Not a number!");
        return;
      }

      await this.update({
        "system.selected": status
      });
    }
  }
}
