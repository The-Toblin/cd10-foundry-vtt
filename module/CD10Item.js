export default class CD10Item extends Item {

    get acceptedAmmoList() {
        return this.actor.sheet.ammoList.filter(a => a.data.ammoType == this.data.data.acceptedAmmo)
    }

    chatTemplate = {
        "weapon": "systems/cd10/templates/partials/weapon-card.hbs",
        "armor": "systems/cd10/templates/partials/armor-card.hbs",
        "skill": "systems/cd10/templates/partials/skill-card.hbs",
        "trait": "systems/cd10/templates/partials/trait-card.hbs"
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