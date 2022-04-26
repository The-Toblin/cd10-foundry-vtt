import CD10BaseSheet from "./CD10BaseSheet.js";

export default class CD10MookCharacterSheet extends CD10BaseSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      template: "systems/cd10/templates/sheets/mookCharacter-sheet.hbs",
      classes: ["cd10", "sheet", "mookCharacter"],
      height: 930,
      width: 800
    });
  }

  /* Define which template to be used by this actor type. */
  get template() {
    return "systems/cd10/templates/sheets/mookCharacter-sheet.hbs";
  }
}
