export default class CD10Item extends Item {
  get acceptedAmmoList() {
    return this.actor.sheet.ammoList.filter(
      a => a.data.ammoType === this.system.acceptedAmmo
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
      if (
        typeof this.system.matchID === "undefined"
        || this.system.matchID === ""
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
