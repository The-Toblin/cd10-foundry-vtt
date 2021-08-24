export default class CD10NamedCharacterSheet extends ActorSheet {

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: "systems/CD10/templates/sheets/namedCharacter-sheet.hbs",
            classes: ["cd10", "sheet", "namedCharacter"]
        });
    }

    get template() {
        return `systems/cd10/templates/sheets/namedCharacter-sheet.hbs`;
    }

    getData() {
        const sheetData = super.getData();
        sheetData.config = CONFIG.cd10;
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
        return sheetData;
    }
}