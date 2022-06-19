export default class CD10ItemSheet extends ItemSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      width: 725,
      height: 600,
      classes: ["cd10", "sheet", "item"]
    });
  }

  get template() {
    return `systems/cd10/templates/sheets/${this.item.data.type}-sheet.hbs`;
  }

  getData() {
    const baseData = super.getData();
    let sheetData = {
      owner: this.item.isOwner,
      editable: this.isEditable,
      item: baseData.item,
      data: baseData.item.data.data,
      config: CONFIG.cd10
    };

    /* Make system settings available for sheets to use for rendering */
    sheetData.damageTypeSetting = game.settings.get(
      "cd10",
      "systemDamageTypes"
    );
    sheetData.barterSetting = game.settings.get("cd10", "systemBarter");
    sheetData.modernity = game.settings.get("cd10", "systemModernity");
    sheetData.showImages = game.settings.get("cd10", "systemShowImageInChat");

    /* Used for selecting skills for weapons. */
    sheetData.worldSkills = [];
    for (const skill of game.items) {
      if (skill.type === "skill") sheetData.worldSkills.push({
        matchID: skill.data.data.matchID,
        name: skill.name
      });
    }
    return sheetData;
  }

  activateListeners(html) {
    html.find(".damage-select").click(this._onDamageSelect.bind(this));
    super.activateListeners(html);
  }

  async _onDamageSelect(event) {
    /* Monitor the state of damage types on Ammo Sheets. */
    event.preventDefault();
    const damageType = event.currentTarget.dataset.damageType;

    await this.item.update({
      "data.damage": {
        slash: {
          selected: false
        },
        pierce: {
          selected: false
        },
        blunt: {
          selected: false
        },
        energy: {
          selected: false
        }
      }
    });

    await this.item.update({
      [`data.damage.${damageType}.selected`]: true
    });
  }
}
