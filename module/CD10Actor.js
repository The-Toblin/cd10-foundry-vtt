export default class CD10Actor extends Actor {

    get getSkills() {
        return this.data.items.filter(p =>
            p.data.type == "skill"
        );
    };

    get getSpells() {
        return this.data.items.filter(p =>
            p.data.type == "spell"
        );
    };

    get getTraits() {
        return this.data.items.filter(p =>
            p.data.type == "trait"
        );
    };

    get getArmors() {
        return this.data.items.filter(p =>
            p.data.type == "armor" && p.data.data.isShield.value == false
        );
    };

    get getShields() {
        return this.data.items.filter(p =>
            p.data.type == "armor" && p.data.data.isShield.value == true
        );
    };

    get getMeleeWeapons() {
        return this.data.items.filter(p =>
            p.data.type == "weapon" && p.data.data.isRanged.value == false
        );
    };

    get getRangedWeapons() {
        return this.data.items.filter(p =>
            p.data.type == "weapon" && p.data.data.isRanged.value == true
        );
    };

    get getShock() {
        return parseInt(this.data.data.shock.value)
    };

    get getWounds() {
        return parseInt(this.data.data.wounds.value)
    };

    get getModifier() {
        return parseInt(this.data.data.modifier.value)
    }
}