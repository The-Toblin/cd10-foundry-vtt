import * as Dice from "../CD10Dice.js";

export default class CD10NamedCharacterSheet extends ActorSheet {
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

  /**
   * Define ContextMenus
   */

  // TODO: Create doc description.
  equippableItemContextMenu = [
    {
      name: game.i18n.localize("cd10.sheet.edit"),
      icon: '<i class="fas fa-edit"></i>',
      callback: element => {
        const itemId = element.data("item-id");
        const item = this.actor.items.get(itemId);

        item.sheet.render(true);
      }
    },
    {
      name: game.i18n.localize("cd10.sheet.equip"),
      icon: '<i class="far fa-caret-square-up"></i>',

      callback: element => {
        const itemId = element.data("item-id");
        const item = this.actor.items.get(itemId);
        let boolValue = item.data.data.isEquipped.value;

        item.update({
          data: {
            isEquipped: {
              value: !boolValue
            }
          }
        });
      }
    },
    {
      name: game.i18n.localize("cd10.sheet.remove"),
      icon: '<i class="fas fa-trash"></i>',
      callback: element => {
        this.actor.deleteEmbeddedDocuments("Item", [element.data("item-id")]);
      }
    }
  ];

  // TODO: Create doc description.
  itemSkillContextMenu = [
    {
      name: game.i18n.localize("cd10.sheet.edit"),
      icon: '<i class="fas fa-edit"></i>',
      callback: element => {
        const itemId = element.data("item-id");
        const item = this.actor.items.get(itemId);

        item.sheet.render(true);
      }
    },
    {
      name: game.i18n.localize("cd10.sheet.levelUp"),
      icon: '<i class="fas fa-angle-double-up"></i>',
      callback: element => {
        const itemId = element.data("item-id");
        const item = this.actor.items.get(itemId);

        let levelUpValue = item.data.data.levelUp.value;

        item.update({
          "data.levelUp.value": !levelUpValue
        });
      }
    },
    {
      name: game.i18n.localize("cd10.sheet.remove"),
      icon: '<i class="fas fa-trash"></i>',
      callback: element => {
        this.actor.deleteEmbeddedDocuments("Item", [element.data("item-id")]);
      }
    }
  ];

  // TODO: Create doc description.
  itemContextMenu = [
    {
      name: game.i18n.localize("cd10.sheet.edit"),
      icon: '<i class="fas fa-edit"></i>',
      callback: element => {
        const itemId = element.data("item-id");
        const item = this.actor.items.get(itemId);

        item.sheet.render(true);
      }
    },
    {
      name: game.i18n.localize("cd10.sheet.remove"),
      icon: '<i class="fas fa-trash"></i>',
      callback: element => {
        this.actor.deleteEmbeddedDocuments("Item", [element.data("item-id")]);
      }
    }
  ];

  // TODO: Create doc description.
  getData() {
    /* Override default getData() function */
    const sheetData = super.getData();
    sheetData.config = CONFIG.cd10;
    sheetData.data = sheetData.data.data;

    /* Sort items alphabetically */
    sheetData.items.sort(function(a, b) {
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });

    /* Create subproperties for item types */
    sheetData.ammunition = sheetData.items.filter(p => p.type === "ammunition");
    sheetData.allArmors = sheetData.items.filter(p => p.type === "armor" || p.type === "shield");
    sheetData.armors = sheetData.items.filter(p => p.type === "armor");
    sheetData.shields = sheetData.items.filter(p => p.type === "shield");
    sheetData.allWeapons = sheetData.items.filter(p => p.type.match(/Weapon/));
    sheetData.meleeWeapons = sheetData.items.filter(p => p.type === "meleeWeapon");
    sheetData.rangedWeapons = sheetData.items.filter(p => p.type === "rangedWeapon");
    sheetData.skills = sheetData.items.filter(p => p.type === "skill");
    sheetData.traits = sheetData.items.filter(p => p.type === "trait");
    sheetData.posTraits = sheetData.traits.filter(p => p.data.skillLevel.value > 0);
    sheetData.negTraits = sheetData.traits.filter(p => p.data.skillLevel.value < 0);
    sheetData.spells = sheetData.items.filter(p => p.type === "spell");
    sheetData.normalItems = sheetData.items.filter(
      p =>
        p.type !== "spell"
        && p.type !== "skill"
        && p.type !== "trait"
        && p.type !== "meleeWeapon"
        && p.type !== "armor"
        && p.type !== "rangedWeapon"
        && p.type !== "shield"
    );

    // The following is to detect if certain things are equipped, and thus toggle certain parts of the sheet on or off.
    sheetData.equippedMeleeWeapon = false;
    sheetData.meleeWeapons.forEach(w => {
      if (w.data.isEquipped.value) {
        sheetData.equippedMeleeWeapon = true;
      }
    });

    sheetData.equippedRangedWeapon = false;
    sheetData.rangedWeapons.forEach(w => {
      if (w.data.isEquipped.value) {
        sheetData.equippedRangedWeapon = true;
      }
    });

    sheetData.equippedArmor = false;
    sheetData.armors.forEach(a => {
      if (a.data.isEquipped.value) {
        sheetData.equippedArmor = true;
      }
    });

    sheetData.equippedShield = false;
    sheetData.shields.forEach(s => {
      if (s.data.isEquipped.value) {
        sheetData.equippedShield = true;
      }
    });

    /* Make system settings available for sheets to use for rendering */
    sheetData.damageTypeSetting = game.settings.get("cd10", "systemDamageTypes");
    sheetData.barterSetting = game.settings.get("cd10", "systemBarter");
    sheetData.modernity = game.settings.get("cd10", "systemModernity");

    return sheetData;
  }

  // TODO: Create doc description.
  activateListeners(html) {
    /* Owner-only listeners */
    if (this.actor.isOwner) {
      /* Html.find(".item-roll").click(this._onItemRoll.bind(this));*/
      html.find(".skill-check").click(this._onSkillCheck.bind(this));
      html.find(".attack-check").click(this._attackCheck.bind(this));
      html.find(".physical-save").click(this._onSave.bind(this));
      html.find(".reveal-rollable").on("mouseover mouseout", this._onToggleRollable.bind(this));
      html.find(".stressBox").click(this._stressBoxClicked.bind(this));
      html.find(".item-delete").click(this._onItemDelete.bind(this));
      html.find(".item-equip").click(this._onItemEquip.bind(this));
      html.find(".inline-edit").change(this._onSkillEdit.bind(this));
      html.find(".ammo-select").click(this._onAmmoSelect.bind(this));
      html.find(".skill-item").click(this._toggleSkillUp.bind(this));
      html.find(".wounds-icons").on("click contextmenu", this._onWoundsMarkChange.bind(this));
      html.find(".select-trait").on("click contextmenu", this._onClickTrait.bind(this));

      /* ContextMenu listeners */
      new ContextMenu(html, ".weapon-card", this.equippableItemContextMenu);
      new ContextMenu(html, ".armor-card", this.equippableItemContextMenu);
      new ContextMenu(html, ".equippable-inventory-item", this.equippableItemContextMenu);
      new ContextMenu(html, ".inventory-item", this.itemContextMenu);
      new ContextMenu(html, ".skill-item", this.itemSkillContextMenu);
    }
    /* General listeners */
    /* html.find(".item-create").click(this._onItemCreate.bind(this));*/

    super.activateListeners(html);
  }


  /**
   * Helper functions. These functions are used by other functions on the sheet.
   */


  // TODO: Create doc description.
  _checkHeroPoints() {
    if (this.actor.getExp > 0) {
      this.actor.modifyExp(-1);
      return true;
    } else {
      ui.notifications.error(`${this.actor.name} does not have enough experience.`);
      return false;
    }
  }

  /**
   * A helper function for fetching objects from game or actor.
   * @param {string} id         The itemId to fetch.
   * @param {boolean} actor     (opt) Default: true. If fetching is to be performed on an actor.
   * @returns {Promise<Object>} The fetched object.
   */
  async _fetchObject(id, actor = true) {
    const fetchedObject = actor ? this.actor.items.get(id) : game.items.get(id);
    return fetchedObject;
  }

  /**
   * A helper function that cleans up necessary data to perform a check, attack or save.
   * It determines if the clicked object is a skill or a trait, and sets the proper values.
   * @param {Object} event The clicked event-data, used to fetch the itemId.
   * @returns {Promise<Object>} An object holding the necessary skill and trait data.
   */
  async _fetchRollData(event) {
    const rollObj = await this._fetchObject(event.currentTarget.closest(".item").dataset.itemId, true);
    let trait = {};
    let skill = {};

    if (rollObj.type !== "trait") {
      for (const item of this.getData().traits) {
        if (item.data.selected > 0) {
          trait.id = item._id;
        }
      }
      skill.id = rollObj.id;
    } else if (rollObj.type === "trait") {
      trait.id = item._id;
    }

    return {
      trait: trait,
      skill: skill
    };
  }

  /**
   * Checks if the system is set to dump descriptions to chat, and then does so.
   * @param {Object} item The item-object with which to show the description.
   */
  _rollItem(item) {
    if (game.settings.get("cd10", "systemDumpDescriptions")) item.roll();
  }

  /**
   * Calls the rollitem function for the clicked item. Dumps description to chat.
   * @param {object} item The item in question that needs to be dumped to chat.
   */
  _onItemRoll(item) {
    this._rollItem(item);
  }

  // TODO: Create doc description.
  async _onAmmoSelect(event) {
    let ammoObj = this.actor.items.get(event.currentTarget.closest(".ammo-selector").dataset.itemId);
    let weaponObj = this.actor.items.get(event.currentTarget.closest(".ammo-selector").dataset.weaponId);

    if (weaponObj.data.data.selectedAmmo.id === ammoObj.id) {
      await weaponObj.update({
        "data.selectedAmmo": {
          value: "None",
          id: "None"
        }
      });
    } else {
      await weaponObj.update({
        "data.selectedAmmo": {
          value: ammoObj.name,
          id: ammoObj.id
        }
      });
    }
  }


  /**
   * Sheet functions. These are clickable somewhere on the sheet and perform a function based on what was clicked.
   */


  // TODO: Create doc description.
  _onToggleRollable(event) {
    // JS to reveal 'hidden' CSS classes that are marked 'rollable'
    event.preventDefault();

    const rollables = event.currentTarget.getElementsByClassName("rollable");
    $.each(rollables, function(index, value) {
      $(value).toggleClass("hidden");
    });
  }

  // TODO: Create doc description.
  _onItemEdit(event) {
    event.preventDefault();

    let element = event.currentTarget;
    let itemId = element.closest(".item").dataset.itemId;
    let item = this.actor.items.get(itemId);

    item.sheet.render(true);
  }

  async _onSkillEdit(event) {
    event.preventDefault();

    if (!this.isEditable) return;

    const element = event.currentTarget;
    const itemId = element.closest(".item").dataset.itemId;
    const item = this.actor.items.get(itemId);
    const field = element.dataset.field;

    await item.update({
      [field]: element.value
    });
  }

  // TODO: Create doc description.
  async _onItemDelete(event) {
    event.preventDefault();

    let element = event.currentTarget;
    let itemId = element.closest(".item").dataset.itemId;
    const item = this.actor.items.get(itemId);

    await this.actor.deleteEmbeddedDocuments("Item", [itemId]);
  }

  // TODO: Create doc description.
  async _onItemEquip(event) {
    event.preventDefault();

    let element = event.currentTarget;
    let itemId = element.closest(".item").dataset.itemId;
    const item = this.actor.items.get(itemId);
    const type = item.type;

    let boolValue = item.data.data.isEquipped.value;
    if (!boolValue) {
      await this.actor.unequipItems(type);
    }

    await item.update({
      "data.isEquipped.value": !boolValue
    });
  }

  // TODO: Create doc description.
  _onWoundsMarkChange(event) {
    event.preventDefault();

    if (event.type === "click") {
      this.actor.modifyWounds(1);
    } else {
      this.actor.modifyWounds(-1);
    }
  }

  // TODO: Create doc description.
  _stressBoxClicked(event) {
    event.preventDefault();

    let value = this.actor.data.data.stressing.value;

    this.actor.update({
      "data.stressing.value": !value
    });
  }

  // TODO: Create doc description.
  async _toggleSkillUp(event) {
    event.preventDefault();
    let element = event.currentTarget;
    let itemId = element.closest(".item").dataset.itemId;
    let item = this.actor.items.get(itemId);

    let levelUpValue = item.data.data.levelUp.value;

    await item.update({
      "data.levelUp.value": !levelUpValue
    });
  }

  // TODO: Create doc description.
  async _onClickTrait(event) {
    event.preventDefault();
    let element = event.currentTarget;
    let itemId = element.closest(".item").dataset.itemId;
    let item = this.actor.items.get(itemId);

    if (item.getSelectionStatus === 1 || item.getSelectionStatus === 2) {
      item.setSelectionStatus(0);
      return;
    }

    await this.actor.resetTraitSelection();

    if (event.type === "click") {
      item.setSelectionStatus(1);
    } else {
      item.setSelectionStatus(2);
    }
  }


  /**
   * Roll functions. These functions perform skill checks, attack rolls and saves.
   */


  /**
   * Function called when a skill check is performed from the sheet.
   * @param {HTML} event  HTML context for fetching IDs.
   */
  async _onSkillCheck(event) {
    event.preventDefault();

    // If a hero point is spent, check if there's enough points. Otherwise cancel the check.
    if (event.shiftKey) {
      if (this._checkHeroPoints() === false) {
        return;
      }
    }

    const rollData = await this._fetchRollData(event);

    try {
      await Dice.SkillCheck({
        actorId: this.actor.id,
        skillId: rollData.skill.id,
        traitId: rollData.trait.id,
        heroPoint: event.shiftKey
      });

      // Reset traits selection.
      this.actor.resetTraitSelection();

    } catch(err) {
      ui.notifications.error("Roll failed. See logs!");
      console.error(err);
    }
  }

  /**
   * Function called when an attack check is performed from the sheet.
   * @param {HTML} event  HTML context for fetching IDs.
   */
  async _attackCheck(event) {
    event.preventDefault();

    // If a hero point is spent, check if there's enough points.
    if (event.shiftKey) {
      if (this._checkHeroPoints() === false) {
        return;
      }
    }

    let damageType = event.currentTarget.dataset.damageType;
    const weaponObj = this.actor.items.get(event.currentTarget.closest(".item").dataset.itemId).data;
    let attackSkill = weaponObj.data.attackSkill.value;

    const skill = {};
    for (const item of this.getData().skills) {
      if (item.data.matchID === weaponObj.data.attackSkill.value) {
        skill.id = item._id;
        skill.level = item.data.skillLevel.value;
      }
    }

    // Catch if weapon doesn't have a skill set.
    if (attackSkill === "None") {
      ui.notifications.error(`Error! ${weaponObj.name} does not have an assigned skill!`);
      return;
    }

    // Catch if character does not have the correct skill for said weapon.
    if (skill.id === undefined) {
      let correctSkill = null;
      for (const skill of game.items.contents) {
        if (skill.data.data.matchID === weaponObj.data.attackSkill.value) {
          correctSkill = skill.name;
        }
      }
      ui.notifications.info(`You do not have the prerequisite skill for ${weaponObj.name}, which is ${correctSkill}. Making blank check.`);
    }

    // Check if it's a ranged weapon and pick the correct, selected ammunition.
    if (weaponObj.type === "rangedWeapon") {
      let ammo = this.actor.items.get(weaponObj.data.selectedAmmo.id);
      if (ammo.data.data.damage.slash.selected) {
        damageType = "slash";
      } else if (ammo.data.data.damage.pierce.selected) {
        damageType = "pierce";
      } else if (ammo.data.data.damage.blunt.selected) {
        damageType = "blunt";
      } else if (ammo.data.data.damage.energy.selected) {
        damageType = "energy";
      }
      if (ammo.data.data.count.value > 0) {
        let count = ammo.data.data.count.value;
        count -= 1;

        ammo.update({
          data: {
            count: {
              value: count
            }
          }
        });
      } else {
        ui.notifications.error("You are out of that ammo type! Select another!");
        return;
      }
    }

    // Finally, check if a trait is checked and if so include it in the data.
    const trait = {};
    for (const item of this.getData().traits) {
      if (item.data.selected > 0) trait.id = item.id;
    }

    /* Perform the attack check */
    try {
      await Dice.AttackCheck({
        actor: this.actor,
        skillId: skill.id,
        traitId: trait.id,
        heroPoint: event.shiftKey,
        damageType: damageType
      });

      // Reset traits selection.
      this.actor.resetTraitSelection();

    } catch(err) {
      ui.notifications.error("Roll failed. See logs!");
      console.error(err);
    }
  }

  // TODO: Create doc description.
  async _onSave(event) {
    event.preventDefault();

    let dialogOptions = {
      classes: ["cd10-dialog", "save-dialog"],
      top: 300,
      left: 400
    };
    new Dialog(
      {
        title: "Save",
        content: await renderTemplate("systems/cd10/templates/partials/save-dialog.hbs", this.getData()),
        buttons: {
          roll: {
            label: "Save!",
            callback: html => this._doSaveStuff(html)
          }
        }
      },
      dialogOptions
    ).render(true);
  }

  /**
   * Following dialog choices, collects the data from the dialog, processes the data
   * and performs the save.
   * @param {HTML} html The data from the dialog.
   */
  async _doSaveStuff(html) {
    // FIXME: Check to see if this actually works.

    // Fetch the necessary save data from the dialog.
    const saveData = {};

    // Check if a trait was selected, if it was reversed, and set the proper values.
    if (html.find("select#trait-selected").val() !== "None") {
      saveData.traitId = this.getData().traits[html.find("select#trait-selected").val()]._id;
      const selectValue = html.find("input#reverseTrait")[0].checked ? 2 : 1;
      await this.actor.items.get(saveData.traitId).update({
        "data.selected": selectValue
      });
    }
    saveData.heroPoint = html.find("input#heroPoint")[0].checked;
    saveData.lethality = parseInt(html.find("input#lethality").val()) || 0;
    saveData.damageType = html.find("select#damage-type").val() || "slash";

    if (saveData.lethality <= 0) {
      ui.notifications.error("Please select a non-zero value for Lethality!");
      return;
    }

    // Check if a heropoint is spent.
    if (saveData.heroPoint) {
      if (this._checkHeroPoints() === false) {
        return;
      }
    }

    console.log("Sheet TraitId: ", saveData.traitId);
    // Roll the save.
    try {
      Dice.Save({
        actor: this.actor,
        traitId: saveData.traitId,
        heroPoint: saveData.heroPoint,
        lethality: saveData.lethality,
        damageType: saveData.damageType
      });

      // Reset traits selection.
      this.actor.resetTraitSelection();

    } catch(err) {
      ui.notifications.error("Save failed. See logs!");
      console.error(err);
    }
  }
}
