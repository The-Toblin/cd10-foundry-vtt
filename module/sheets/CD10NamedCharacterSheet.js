import CD10BaseSheet from "./CD10BaseSheet.js";

export default class CD10NamedCharacterSheet extends CD10BaseSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      template: "systems/cd10/templates/sheets/namedCharacter-sheet.hbs",
      classes: ["cd10", "sheet", "namedCharacter"],
      height: 750,
      width: 750,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "biography"
        }
      ]
    });
  }

  // Define which template to be used by this actor type.
  get template() {
    return "systems/cd10/templates/sheets/namedCharacter-sheet.hbs";
  }
}
