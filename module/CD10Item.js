export default class CD10Item extends Item {

    get acceptedAmmoList() {
        return this.actor.sheet.ammoList.filter(a => a.data.ammoType == this.data.data.acceptedAmmo)
    }

    chatTemplate = {
        "weapon": "systems/cd10_legacy/templates/partials/weapon-card.hbs",
        "armor": "systems/cd10_legacy/templates/partials/armor-card.hbs",
        "skill": "systems/cd10_legacy/templates/partials/spell-card.hbs",
        "trait": "systems/cd10_legacy/templates/partials/spell-card.hbs",
        "spell": "systems/cd10_legacy/templates/partials/spell-card.hbs",
    }

    static async create(data, options) {
        /* Temporary error message to intercept the creation of 'weapon' type items.
        They are deprecated, but to allow smooth migration, they remain in template.json. 
        They will be deleted eventually. */
        if (data.type === "weapon") {
            ui.notifications.error(`The weapon type is deprecated. Use meleeWeapon or rangedWeapon instead. The type will be deleted in the next version.`);
            return
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

        chatData.content = await renderTemplate(this.chatTemplate[this.type], cardData);
        chatData.roll = true;

        return ChatMessage.create(chatData);
    }
}