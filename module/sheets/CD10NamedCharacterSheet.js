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
        let sheetData = super.getData();
        sheetData.config = CONFIG.cd10;
        sheetData.data = sheetData.data.data;
        sheetData.weapons = sheetData.items.filter(function(item) {
            return item.type == "weapon"
        });
        sheetData.armors = sheetData.items.filter(function(item) {
            return item.type == "armor"
        });
        sheetData.skills = sheetData.items.filter(function(item) {
            return item.type == "skill"
        });
        sheetData.traits = sheetData.items.filter(function(item) {
            return item.type == "trait"
        });
        sheetData.abilities = sheetData.items.filter(function(item) {
            return item.type == "ability"
        });
        console.log(sheetData.items)
        return sheetData;
    }
}