export default class CD10HeroSheet extends ActorSheet {

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: "systems/CD10/templates/sheets/hero-sheet.hbs",
            classes: ["cd10", "sheet", "hero"]
        });
    }

    get template() {
        return `systems/cd10/templates/sheets/hero-sheet.hbs`;
    }

    getData() {
        const data = super.getData();
        data.config = CONFIG.cd10;
        /*
        data.skills = data.skills.filter(function(skill) {
            return skill.name == "skill"
        });
        data.traits = data.traits.filter(function(trait) {
            return trait.name == "trait"
        });
        data.abilities = data.abilities.filter(function(ability) {
            return ability.name == "ability"
        }); 
        */
        return data;
    }
}