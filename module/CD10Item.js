export default class CD10Item extends Item {

    prepareData() {
        super.prepareData();
    }

    prepareBaseData() {}

    prepareDerivedData() {
        const itemData = this.data;
        const templateData = this.data.data;

    }

    get acceptedAmmoList() {
        /* Grab the current actor's owned ammunition for selection */
        return this.actor.sheet.ammoList.filter(a => a.data.ammoType === this.data.data.acceptedAmmo)
    }

    chatTemplate = {
        "meleeWeapon": "systems/cd10/templates/partials/equipment-cards/weapon-card.hbs",
        "rangedWeapon": "systems/cd10/templates/partials/equipment-cards/rangedWeapon-card.hbs",
        "armor": "systems/cd10/templates/partials/equipment-cards/armor-card.hbs",
        "shield": "systems/cd10/templates/partials/equipment-cards/shield-card.hbs",
        "skill": "systems/cd10/templates/partials/spell-card.hbs",
        "trait": "systems/cd10/templates/partials/spell-card.hbs",
        "spell": "systems/cd10/templates/partials/spell-card.hbs",
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

    async _preCreate(data, options, user) {
        /* Hijack preCreate to create a matchID for items that is persistent across characters. 
        This is mainly used to match weapons with their combat skills. */

        if (!this.isEmbedded && this.type === 'skill' && typeof this.data.data.matchID == 'undefined') {
            let matchID = randomID();

            await this.data.update({
                "data.matchID": {
                    "type": "text",
                    "label": "MatchID",
                    "value": matchID
                }
            });
        }
        return await super._preCreate(data, options, user)
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