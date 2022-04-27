/**
 * Core Dice roller class for handling all types of checks.
 * Contains helper functions for resolving things necessary for checks.
 *
 * Exports three functions for handling basic skill checks, attack checks
 * and physical saves.
 */


/**
 * * Creates the RollFormula for use in dicerolls, based on the data delivered to it.
 * @param {object} rollData               An object parameter, holding the date necessary to create the rollformula.
 * @param {number} rollData.skillLevel    (opt) The skill's level to use for the formula.
 * @param {number} rollData.traitLevel    (opt) If a trait is provided, add it's number to the formula.
 * @param {number} rollData.modifier      (opt) The actor's modifier, if provided.
 * @param {boolean} rollData.save         (opt) If the roll is a save, omit the modifier.
 * @param {boolean} rollData.heroPoint    (opt) If a hero point is spent, double the basedice (2d10).
 * @returns {Promise<string>}             The rollformula as a string.
 */
const _createDiceFormula = async ({skillLevel, traitLevel, modifier, save, heroPoint} = {}) => {

  let rollFormula = heroPoint ? "2d10" : "1d10";

  if (skillLevel > 0) rollFormula += " + @skillLevel";
  if (traitLevel > 0) {
    rollFormula += " + @traitLevel";
  } else if (traitLevel < 0) {
    rollFormula += " @traitLevel";
  }
  if (modifier > 0 && !save) rollFormula += " @modifier";
  return rollFormula;
};

/**
 * Creates the rollData necessary to perform a roll. It first checks to see if the roll
 * performed is a save, and if so, simplifies the data.
 * @param {number} skillLevel The skill level to apply to the data.
 * @param {number} traitLevel The trait level, if any to apply to the data.
 * @param {number} modifier   The character's modifier to apply to the data.
 * @param {boolean} save      A boolean telling the function it's save to simplify the data.
 * @returns {Promise<object>} An object holding the finished rollData.
 */
const _createRollData = async (skillLevel, traitLevel, modifier, save) => {
  if (save) {
    return {
      traitLevel: parseInt(traitLevel)
    };} else {
    return {
      skillLevel: parseInt(skillLevel),
      traitLevel: parseInt(traitLevel),
      modifier: parseInt(modifier *= -1)
    };
  }
};

/**
 * Helper function for the roll renderer. Creates a list of rolled dice
 * marking 0's as failures (red) and 9's as successes (green).
 * @param {Array} diceRolls The object holding all the rolls.
 * @returns {Promise/HTML} HTML list segment for use in chatdata.
 */
const _diceList = async diceRolls => {
  const results = {
    0: '<li class="roll die d10 failure">',
    9: '<li class="roll die d10 success">'
  };

  let rolledList = "";
  for (const roll of diceRolls) {
    rolledList += `${results[roll.result] || '<li class="roll die d10">'} ${roll.result} </li>`;
  }

  return rolledList;
};

/**
 * Perform a single CD10 roll.
 * @param {string} rollFormula The rollformula to use for rolls.
 * @param {object} rollData An object holding the modifiers to use for the roll.
 * @returns {Promise<object>} A object holding the roll.
 */
const _rollD10 = async (rollFormula, rollData) => {
  const CD10Roll = new Roll(rollFormula, rollData);
  await CD10Roll.evaluate({async: true});

  // Shift die to 0-9 and remove the equal amount from the total sum.
  for (let i = 0; i < CD10Roll.terms[0].results.length; i++) {
    CD10Roll.terms[0].results[i].result -= 1;
    CD10Roll._total -= 1;
  }

  return CD10Roll;
};

/**
 * Handle the actual roll evaluation, based on rolled 9's and 0's. Will automatically
 * call for rerolls on those results and add those to the array of results.
 * @param {string} rollFormula The rollformula to use for rolls.
 * @param {object} rollData An object holding the modifiers to use for the roll.
 * @returns {Promise<object>} A object holding the roll, the total and any number of nines and zeroes.
 */
const _doCD10Roll = async (rollFormula, rollData) => {
  // Define all the variables we'll need.
  let stopValue = false;
  let nines = 0;
  let zeroes = 0;
  let iterator = 0;
  let reroll;

  // Perform a roll
  const roll = await _rollD10(rollFormula, rollData);

  /* This loop checks the roll if it's 9 or 0 and makes a new roll. The reroll is added to the results of the roll,
  * and rechecked in this loop. It ends when the result is either double zeroes or the reroll is not a 9. */
  while (!stopValue) {
    let result = roll.terms[0].results[iterator].result;

    if (result === 9) {
      nines += 1;
      roll._total -= 5;
      roll.terms[0].results[iterator].rerolled = true;
      reroll = await _rollD10("1d10");

    } else if (result === 0 && zeroes === 0 && nines === 0) {
      zeroes += 1;
      roll.terms[0].results[iterator].rerolled = true;
      reroll = await _rollD10("1d10");
    }

    if (reroll) {
      roll.terms[0].results.push({
        result: reroll.terms[0].results[0].result,
        active: true
      });
      roll._total += reroll.terms[0].results[0].result;
      reroll = null;
    }

    ++iterator;

    if (result === 0) {
      stopValue = zeroes === 1;
    } else if (result !== 9) stopValue = true;
  }

  return {
    roll: roll,
    nines: nines,
    zeroes: zeroes
  };
};

/**
 * Render the rolled results to HTML for use it templates and chatmessages.
 * @param {string} formula A string holding the rollformula for display.
 * @param {object} diceRolls An object holding roll results for display.
 * @returns {Promise<HTML>} An HTML snippet holding rendered roll results.
 */
const _renderCD10Roll = async (formula, diceRolls) => {
  const listContents = await _diceList(diceRolls.roll.terms[0].results);
  const renderedRoll =
      `<div class="dice-roll">
        <div class="dice-result">
          <div class="dice-formula">
            ${formula}
          </div>
          <div class="dice-tooltip expanded">
            <section class="tooltip-part">
              <div class="dice">
                <ol class="dice-rolls">
                  ${listContents}
                </ol>
              </div>
            </section>
          </div>
        </div>
      </div>`;
  return renderedRoll;
};

/**
 * Helper function to find the data from the skill used and return it as an object.
 * @param {object} actor      The actor that performs the roll.
 * @param {string} skillId    An id for the skill being used.
 * @returns {Promise<object>} An object holding the skillLevel and name.
 */
const _getSkillData = async (actor, skillId) => {
  if (skillId) {
    const skill = actor.items.get(skillId);
    return {
      level: parseInt(skill.data.data.skillLevel.value),
      name: skill.name
    };
  } else {
    return {
      level: 0,
      name: "No skill!"
    };
  }
};

/**
 * Helper function to find the data from the trait used and return it as an object.
 * @param {object} actor      The actor that performs the roll.
 * @param {string} traitId    An id for the trait being used.
 * @returns {Promise<object>} An object holding the traitLevel and name.
 */
const _getTraitData = async (actor, traitId) => {
  if (traitId) {
    const trait = actor.items.get(traitId);
    const traitLevel = parseInt(trait.data.data.skillLevel.value);
    const reversed = trait.data.data.selected === 2;

    return {
      level: reversed ? (traitLevel * -1) : traitLevel,
      name: trait.name
    };
  } else {
    return {
      level: 0,
      name: null
    };
  }
};

/**
 * Helper function that returns a list of all equipped items of an actor.
 * @param {object} actor      The actor whose items you want to check.
 * @returns {Promise<object>} An object holding the equipped items.
 */
const _getEquipment = async actor => {
  const equipmentList = {
    armor: null,
    shield: null,
    meleeWeapon: null,
    rangedWeapon: null
  };
  for (const item of actor.items.contents) {
    if (item.type === "armor" && item.data.data.isEquipped?.value) {
      equipmentList.armor = item;
    } else if (item.type === "shield" && item.data.data.isEquipped?.value) {
      equipmentList.shield = item;
    } else if (item.type === "meleeWeapon" && item.data.data.isEquipped?.value) {
      equipmentList.meleeWeapon = item;
    } else if (item.type === "rangedWeapon" && item.data.data.isEquipped?.value) {
      equipmentList.rangedWeapon = item;
    }
  }

  return equipmentList;

};

/**
 * Determines the lethality caused by a weapon being used.
 * @param {object} actor           The Actor object. Required for finding the ammunition for ranged weapons.
 * @param {object} equipmentList  An object holding the actor's equipped items.
 * @param {string} damageType     The damage type, pulled from the click on the sheet.
 * @returns {Promise<number>}     Returns a number for the lethality.
 */
const _getLethality = async (actor, equipmentList, damageType) => {
  if (equipmentList.meleeWeapon !== null) {
    return parseInt(equipmentList.meleeWeapon.data.data.damage[damageType].value);
  } else if (equipmentList.rangedWeapon !== null) {
    const ammo = actor.items.get(equipmentList.rangedWeapon.data.data.selectedAmmo.id);
    const ammoProperties = Object.entries(ammo.data.data.damage);

    // Loop through the properties of the ammo to find the selected ammo type and fetch its lethality value.
    for (const entry of ammoProperties) {
      if (entry[1].selected) return parseInt(entry[1].value);
    }
  }

};

/**
 * Gathers up the necessary data to proceed with the check. It will define which actor is performing the check,
 * what skill is being used, if a trait is being used and if it's reversed, the outcome of the rolls, as well
 * as the HTML template used to render the chatmessage.
 * @param {object} actor      The Actor object.
 * @param {string} skillId    (opt) The skill's Id.
 * @param {string} traitId    (opt) The trait's Id.
 * @param {boolean} save      (opt) If the check is a save.
 * @param {boolean} heroPoint (opt) If a hero point is spent.
 * @returns {Promise<object>} An object containing the objects of the actor, skill, trait and the roll results.
 */
const _performBaseCheck = async (actor, skillId, traitId, save, heroPoint) => {
  const skill = await _getSkillData(actor, skillId);
  const trait = await _getTraitData(actor, traitId);

  // Construct the rollformula and rolldata required for the roll.
  const rollformula = await _createDiceFormula({skillLevel: skill.level, traitLevel: trait.level,
    modifier: actor.getModifier, save: save, heroPoint: heroPoint});
  const rollData = await _createRollData(skill.level, trait.level, actor.getModifier, save);

  // Perform and render the roll.
  const rollResults = await _doCD10Roll(rollformula, rollData);
  const renderedRoll = await _renderCD10Roll(rollResults.roll._formula, rollResults);

  return {
    actor: actor,
    skill: skill,
    trait: trait,
    roll: rollResults,
    render: renderedRoll
  };
};

/**
 * Perform a standard skill check.
 * @param {object}  checkData             An object holding the necessary data.
 * @param {object}  checkData.actor       The actor object performing the skill check.
 * @param {string}  checkData.skillId     (opt) The ID of the skill the actor is using.
 * @param {string}  checkData.traitId     (opt) The ID of the trait the actor is using.
 * @param {boolean} checkData.heroPoint   (opt) Whether or not the Actor is spending a hero point on this check.
 */
export const SkillCheck = async ({actor = null, skillId = null, traitId = null, heroPoint = false} = {}) => {
  const messageTemplate = "systems/cd10/templates/partials/chat-messages/skill-check.hbs";
  const checkResults = await _performBaseCheck(actor, skillId, traitId, false, heroPoint);

  const templateContext = {
    skillName: checkResults.skill.name,
    skillLevel: parseInt(checkResults.skill.level),
    traitName: checkResults.trait.name,
    traitLevel: parseInt(checkResults.trait.level),
    nines: parseInt(checkResults.roll.nines),
    zeroes: parseInt(checkResults.roll.zeroes),
    total: parseInt(checkResults.roll.roll._total),
    roll: checkResults.render
  };

  const chatData = {
    speaker: ChatMessage.getSpeaker(),
    roll: checkResults.roll.roll,
    content: await renderTemplate(messageTemplate, templateContext),
    sound: CONFIG.sounds.dice,
    type: CONST.CHAT_MESSAGE_TYPES.ROLL
  };

  ChatMessage.create(chatData, templateContext);
};

/**
 * Perform an attack check.
 * @param {object}  attackData             An object holding the necessary data.
 * @param {string}  attackData.actor       The actor object performing the skill check.
 * @param {string}  attackData.skillId     (opt) The ID of the skill the actor is using.
 * @param {string}  attackData.traitId     (opt) The ID of the trait the actor is using.
 * @param {boolean} attackData.heroPoint   (opt) Whether or not the Actor is spending a hero point on this check.
 * @param {string}  attackData.damageType  (opt) The damagetype of the attack. Defaults to "slash".
 */
export const AttackCheck = async ({actor = null, skillId = null, traitId = null, heroPoint = false, damageType = "slash"} = {}) => {
  const messageTemplate = "systems/cd10/templates/partials/chat-messages/attack-check.hbs";
  const checkResults = await _performBaseCheck(actor, skillId, traitId, false, heroPoint);
  checkResults.damageType = damageType;

  // Get a list of equipped items.
  checkResults.equipmentList = await _getEquipment(checkResults.actor);

  // Determine the lethality of the weapon used and add any bonus damage from rolling 9's.
  checkResults.lethality = await _getLethality(checkResults.actor, checkResults.equipmentList, checkResults.damageType);
  checkResults.bonusDamage = parseInt(checkResults.roll.nines * 4);

  const templateContext = {
    skillName: checkResults.skill.name,
    skillLevel: parseInt(checkResults.skill.level),
    traitName: checkResults.trait.name,
    traitLevel: parseInt(checkResults.trait.level),
    weapon: checkResults.equipmentList.meleeWeapon || checkResults.equipmentList.rangedWeapon,
    weaponDamage: parseInt(checkResults.lethality),
    lethality: parseInt(checkResults.lethality) + parseInt(checkResults.bonusDamage),
    bonusDamage: parseInt(checkResults.bonusDamage),
    type: checkResults.damageType,
    nines: parseInt(checkResults.roll.nines),
    zeroes: parseInt(checkResults.roll.zeroes),
    total: parseInt(checkResults.roll.roll._total),
    roll: checkResults.render
  };

  const chatData = {
    speaker: ChatMessage.getSpeaker(),
    roll: checkResults.roll.roll,
    content: await renderTemplate(messageTemplate, templateContext),
    sound: CONFIG.sounds.dice,
    type: CONST.CHAT_MESSAGE_TYPES.ROLL
  };

  ChatMessage.create(chatData, templateContext);
};
/**
 * Perform a wound save.
 * @param {object}  saveData             An object holding the necessary data.
 * @param {string}  saveData.actor       The actor object performing the skill check.
 * @param {string}  saveData.traitId     (opt) The ID of the trait the actor is using.
 * @param {boolean} saveData.heroPoint   (opt) Whether or not the Actor is spending a hero point on this check.
 * @param {number}  saveData.lethality   The Lethality the save is performed against.
 * @param {string}  saveData.damageType  (opt) The damagetype of the attack. Defaults to "slash".
 */
export const Save = async ({actor = null, traitId = null, heroPoint = false, lethality = 0, damageType = "slash"} = {}) => {
  const messageTemplate = "systems/cd10/templates/partials/chat-messages/save.hbs";
  const checkResults = await _performBaseCheck(actor, null, traitId, true, heroPoint);
  checkResults.damageType = damageType;
  console.warn(checkResults);


  // TODO: Finish function and update the template
};
