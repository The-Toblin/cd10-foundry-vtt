import CD10BaseSheet from "./CD10BaseSheet.js";

/**
 * Override parent class with different settings and templates.
 */
export default class CD10MajorCharacterSheet extends CD10BaseSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      template: "systems/cd10/templates/sheets/majorCharacter-sheet.hbs",
      classes: ["cd10", "sheet", "cd10-sheet"],
      height: 775,
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
    return "systems/cd10/templates/sheets/majorCharacter-sheet.hbs";
  }
}
