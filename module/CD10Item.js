export default class CD10Item extends Item {
  get acceptedAmmoList() {
    return this.actor.sheet.ammoList.filter(
      a => a.data.ammoType === this.data.data.acceptedAmmo
    );
  }

  chatTemplate = {
    weapon: "systems/cd10/templates/partials/weapon-card.hbs",
    armor: "systems/cd10/templates/partials/armor-card.hbs",
    skill: "systems/cd10/templates/partials/spell-card.hbs",
    trait: "systems/cd10/templates/partials/spell-card.hbs",
    spell: "systems/cd10/templates/partials/spell-card.hbs"
  };

  async _preCreate(data, options, user) {
    /* Hijack preCreate to create a matchID for items that is persistent across characters.
        This is mainly used to match weapons with their combat skills. */

    if (!this.isEmbedded && this.type === "skill") {
      if (
        typeof this.data.data.matchID === "undefined"
        || this.data.data.matchID === ""
      ) {
        await this.data.update({
          data: {
            matchID: randomID()
          }
        });
      }
    }

    return await super._preCreate(data, options, user);
  }

  static async create(data, options) {
    /* Temporary error message to intercept the creation of 'weapon' type items.
        They are deprecated, but to allow smooth migration, they remain in template.json.
        They will be deleted eventually. */
    if (data.type === "weapon") {
      ui.notifications.error(
        "The weapon type is deprecated. Use meleeWeapon or rangedWeapon instead. The type will be deleted in the next version."
      );
      return;
    }
    return await super.create(data, options);
  }

  async roll() {
    let chatData = {
      user: game.user.data._id,
      speaker: ChatMessage.getSpeaker()
    };

    let cardData = {
      ...this.data,
      owner: this.actor.data._id
    };

    chatData.content = await renderTemplate(
      this.chatTemplate[this.type],
      cardData
    );
    chatData.roll = true;

    return ChatMessage.create(chatData);
  }

  async setSelectionStatus(status) {
    if (typeof status !== "number") {
      ui.errors.notifications("Not a number!");
      return;
    }

    await this.update({
      "data.selected": status
    });
  }

  get getSelectionStatus() {
    return this.data.selected;
  }
}
