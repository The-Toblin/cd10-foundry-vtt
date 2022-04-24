/**
 * Core Dice roller class for handling all types of checks.
 * Contains helper functions for resolving things necessary for checks.
 *
 * Exports three functions for handling basic skill checks, attack checks
 * and physical saves.
 */

/**
 * Creates the RollFormula for use in dicerolls, based on the data delivered to it.
 * @param {number} skillLevel   (opt) The skill's level to use for the formula.
 * @param {number} traitLevel   (opt) If a trait is provided, add it's number to the formula.
 * @param {number} modifier     (opt) The actor's modifier, if provided.
 * @param {boolean} save        (opt) If the roll is a save, omit the modifier.
 * @param {boolean} heroPoint   (opt) If a hero point is spent, double the basedice (2d10).
 * @returns {Promise<string>}
 */
const _createDiceFormula = async (skillLevel, traitLevel, modifier, save, heroPoint) => {
  const baseDice = heroPoint === true ? "2d10" : "1d10";
  let rollFormula = `${baseDice}`;

  if (skillLevel > 0) rollFormula += " + @skillLevel";

  if (traitLevel !== null && traitLevel > 0) {
    rollFormula += " + @traitLevel";
  } else if (traitLevel !== null && traitLevel < 0) {
    rollFormula += " @traitLevel";
  }

  if (modifier > 0 && !save) rollFormula += " - @modifier";
  return rollFormula;
};

const _createRollData = async (skillLevel = null, traitLevel = null, modifier = null) => {
  return {
    skillLevel: skillLevel,
    traitLevel: traitLevel,
    modifier: modifier
  };
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
 * @param {Object} rollData An object holding the modifiers to use for the roll.
 * @returns {Promise<Object>} A object holding the roll.
 */
const _rollD10 = async (rollFormula, rollData) => {
  const CD10Roll = new Roll(rollFormula, rollData);
  await CD10Roll.evaluate({async: true});

  /* Shift die to 0-9 */
  for (let i = 0; i < CD10Roll.terms[0].results.length; i++) {
    CD10Roll.terms[0].results[i].result -= 1;
  }

  return CD10Roll;
};

/**
 * Handle the actual roll evaluation, based on rolled 9's and 0's. Will automatically
 * call for rerolls on those results and add those to the array of results.
 * @param {string} rollFormula The rollformula to use for rolls.
 * @param {Object} rollData An object holding the modifiers to use for the roll.
 * @returns {Promise<Object>} A object holding the roll, the total and any number of nines and zeroes.
 */
const _doCD10Roll = async (rollFormula, rollData) => {
  let stopValue = false;
  let rollTotal = 0;
  let nines = 0;
  let zeroes = 0;
  let iterator = 0;
  let reroll;

  const roll = await _rollD10(rollFormula, rollData);

  while (!stopValue) {
    if (roll.terms[0].results[iterator].result === 9) {
      nines += 1;
      roll.terms[0].results[iterator].rerolled = true;
      reroll = await _rollD10("1d10");
    } else if (roll.terms[0].results[iterator].result === 0 && zeroes === 0 && nines === 0) {
      zeroes += 1;
      roll.terms[0].results[iterator].rerolled = true;
      reroll = await _rollD10("1d10");
    } else {
      stopValue = true;
    }
    if (reroll) {
      roll.terms[0].results.push({
        result: reroll.terms[0].results[0].result,
        active: true
      });
      reroll = null;
    }
    ++iterator;
  }

  rollTotal += roll.terms[0].results[iterator - 1].result;
  if (nines > 0) rollTotal += nines * 4;

  return {
    roll: roll,
    rollTotal: rollTotal,
    nines: nines,
    zeroes: zeroes
  };
};

/**
 * Render the rolled results to HTML for use it templates and chatmessages.
 * @param {string} formula A string holding the rollformula for display.
 * @param {Object} diceRolls An object holding roll results for display.
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

const _getSkillData = async (actor, skillId = null) => {
  if (skillId !== null) {
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

const _getTraitData = async (actor, traitId = null) => {
  if (traitId !== null) {
    const trait = actor.items.get(traitId);
    const traitLevel = parseInt(trait.data.data.skillLevel.value);
    const reversed = trait.data.data.reversed.value;
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
 * Gathers up the necessary data to proceed with the check. It will define which actor is performing the check,
 * what skill is being used, if a trait is being used and if it's reversed, the outcome of the rolls, as well
 * as the HTML template used to render the chatmessage.
 * @param {string} actorId    The actor's Id.
 * @param {string} skillId    (opt) The skill's Id.
 * @param {string} traitId    (opt) The trait's Id.
 * @param {boolean} heroPoint (opt) If a hero point is spent.
 * @returns {Promise<Object>} An object containing the objects of the actor, skill, trait and the roll results.
 */
const _performBaseCheck = async (actorId = null, skillId = null, traitId = null, heroPoint = false) => {
  const actor = await game.actors.get(actorId);
  const skill = await _getSkillData(actor, skillId);
  const trait = await _getTraitData(actor, traitId);

  // Construct the rollformula and rolldata required for the roll.
  const rollformula = await _createDiceFormula(skill.level, trait.level, actor.getModifier, false, heroPoint);
  const rollData = await _createRollData(skill.level, trait.level, actor.getModifier);

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
 * @param {Object} param0             An object holding the necessary data.
 * @param {string} param0.actorId     The ID of the actor performing the skill check.
 * @param {string} param0.skillId     (opt) The ID of the skill the actor is using.
 * @param {string} param0.traitId     (opt) The ID of the trait the actor is using.
 * @param {boolean} param0.heroPoint  (opt) Whether or not the Actor is spending a hero point on this check.
 */
export const SkillCheck = async ({actorId = null, skillId = null, traitId = null, heroPoint = false} = {}) => {
  const messageTemplate = "systems/cd10/templates/partials/chat-messages/skill-check.hbs";
  const checkResults = await _performBaseCheck(actorId, skillId, traitId, heroPoint);
  console.log(checkResults);

  // TODO: Finish function
};

/**
 * Perform an attack check.
 * @param {Object} param0             An object holding the necessary data.
 * @param {string} param0.actorId     The ID of the actor performing the attack.
 * @param {string} param0.skillId     (opt) The ID of the skill the actor is using.
 * @param {string} param0.traitId     (opt) The ID of the trait the actor is using.
 * @param {boolean} param0.heroPoint  (opt) Whether or not the Actor is spending a hero point on this check.
 * @param {string} param0.damageType  (opt) The damagetype of the attack. Defaults to "slash".
 */
export const AttackCheck = async ({actorId = null, skillId = null, traitId = null, heroPoint = false, damageType = "slash"} = {}) => {
  const messageTemplate = "systems/cd10/templates/partials/chat-messages/attack-check.hbs";
  const checkResults = await _performBaseCheck(actorId, skillId, traitId, heroPoint);
  checkResults.damageType = damageType;
  console.log(checkResults);

  // TODO: Finish function
};
/**
 * Perform a wound save.
 * @param {Object} param0             An object holding the necessary data.
 * @param {string} param0.actorId     The ID of the actor performing the skill check.
 * @param {string} param0.traitId     (opt) The ID of the trait the actor is using.
 * @param {boolean} param0.heroPoint  (opt) Whether or not the Actor is spending a hero point on this check.
 * @param {number} param0.lethality   The Lethality the save is performed against.
 * @param {string} param0.damageType  (opt) The damagetype of the attack. Defaults to "slash".
 */
export const Save = async ({actorId = null, traitId = null, heroPoint = false, lethality = 0, damageType = "slash"} = {}) => {
  const messageTemplate = "systems/cd10/templates/partials/chat-messages/save.hbs";
  const checkResults = await _performBaseCheck(actorId, traitId, heroPoint);
  console.log(checkResults);

  // TODO: Finish function and update the template
};

/* Core dice roll functions for making skillchecks, attacks and saves. The variable checkType determines
how this class functions. */
/**
 *
 * @param root0
 * @param root0.actor
 * @param root0.checkType
 * @param root0.skillObj
 * @param root0.traitObj
 * @param root0.traitReversed
 * @param root0.usingShield
 * @param root0.shieldObj
 * @param root0.weaponObj
 * @param root0.armorObj
 * @param root0.lethality
 * @param root0.damageType
 * @param root0.heroPoint
 * @param root0.modifier
 */
export async function TaskCheck({
  actor = null,
  checkType = null,
  skillObj = null,
  traitObj = null,
  traitReversed = false,
  usingShield = false,
  shieldObj = null,
  weaponObj = null,
  armorObj = null,
  lethality = 0,
  damageType = "slash",
  heroPoint = false,
  modifier = 0
} = {}) {
  /* Basic error checking */
  if (checkType === null) {
    ui.notifications.error("FATAL ERROR! CheckType not set!");
    return;
  }

  /* Set up base dice formula based on if it's a hero point check or not.
    Also set up required variables. */

  let baseDice = heroPoint === true ? "2d10" : "1d10";
  let rollFormula = null;
  let rollData = null;
  let skillName = null;
  let traitName = null;
  let skillLevel = null;
  let traitLevel = null;

  /* Set up correct chat message template */
  let messageTemplate = null;
  if (checkType === "Simple" || checkType === "Complex") {
    messageTemplate =
      "systems/cd10/templates/partials/chat-messages/skill-check.hbs";
  } else if (checkType === "Attack" || checkType === "SimpleAttack") {
    messageTemplate =
      "systems/cd10/templates/partials/chat-messages/attack-check.hbs";
  } else if (checkType === "Save") {
    messageTemplate =
      "systems/cd10/templates/partials/chat-messages/physical-save.hbs";
  }

  /* Fetch skill level */
  if (skillObj !== null) {
    skillLevel = parseInt(skillObj.data.data.skillLevel.value);
    skillName = skillObj.name;
  } else {
    skillName = null;
  }

  /* Set up traitLevel for the roll */
  if (traitObj !== null) {
    traitName = traitObj.name;
    traitLevel = parseInt(traitObj.data.data.skillLevel.value);

    if (traitReversed) {
      traitLevel *= -1;
    }
  }

  /* Set up the rollformula */
  rollFormula = `${baseDice}`;

  if (skillLevel > 0) {
    rollFormula += " + @skillLevel";
  }

  if (traitLevel > 0) {
    rollFormula += " + @traitLevel";
  } else if (traitLevel < 0) {
    rollFormula += " @traitLevel";
  }

  if (modifier > 0 && checkType !== "Save") {
    rollFormula += " - @modifier";
  }

  /* Check if an attempt is being made without possessing the necessary skill. */
  if (checkType === "Simple" || checkType === "SimpleAttack") {
    if (skillObj === null && traitObj !== null) {
      skillName = traitObj.name;
    } else if (skillObj === null && traitObj === null) {
      skillLevel = 0;
      skillName = "No Skill!";
    }
  }

  rollData = {
    skillLevel: skillLevel,
    traitLevel: traitLevel,
    modifier: modifier
  };

  /* Roll the dice. Save as object for manipulation. */
  const rollResults = await _doCD10Roll(rollFormula, rollData);
  const renderedRoll = await _renderCD10Roll(rollResults.roll._formula, rollResults);

  if (skillLevel) rollResults.rollTotal += skillLevel;
  if (traitLevel) rollResults.rollTotal += traitLevel;
  if (modifier !== 0) rollResults.rollTotal -= modifier;

  /* Set up the roll message data structures based on checkType. */
  let templateContext = null;
  let chatData = null;

  if (checkType === "Simple") {
    templateContext = {
      skillName: skillName,
      skillLevel: skillLevel,
      traitName: traitName,
      traitLevel: traitLevel,
      nines: rollResults.nines,
      zeroes: rollResults.zeroes,
      total: rollResults.rollTotal,
      roll: renderedRoll
    };
  } else if (checkType === "Complex") {
    templateContext = {
      skillName: skillName,
      traitName: traitName,
      roll: renderedRoll,
      traitLevel: traitLevel
    };
  } else if (checkType === "SimpleAttack") {
    let attackOutcome = _handleAttack(
      rollResults.rollTotal,
      skillObj,
      weaponObj,
      damageType,
      actor
    );
    templateContext = {
      traitName: traitName,
      traitLevel: traitLevel,
      nines: rollResults.nines,
      zeroes: rollResults.zeroes,
      total: rollResults.rollTotal,
      roll: renderedRoll,
      weapon: weaponObj,
      weaponDamage: attackOutcome.weaponDamage,
      lethality: attackOutcome.lethality,
      type: damageType,
      skillName: attackOutcome.skillName,
      skillLevel: attackOutcome.skillLevel
    };
  } else if (checkType === "Attack") {
    let attackOutcome = _handleAttack(
      rollResults.rollTotal,
      skillObj,
      weaponObj,
      damageType,
      actor
    );
    templateContext = {
      weapon: weaponObj,
      weaponDamage: attackOutcome.weaponDamage,
      roll: renderedRoll,
      lethality: attackOutcome.lethality,
      excess: attackOutcome.excess,
      type: damageType,
      skillName: attackOutcome.skillName,
      traitName: traitName,
      skillLevel: attackOutcome.skillLevel,
      traitLevel: traitLevel
    };
  } else if (checkType === "Save") {
    let shieldDamageProtection = 0;
    let armorDamageProtection = 0;

    if (armorObj !== null) {
      armorDamageProtection = armorObj.data.protection[damageType].value;
    }

    if (usingShield) {
      shieldDamageProtection = shieldObj.data.protection[damageType].value;
    }

    let outcome = _handleSave(
      rollResults.rollTotal,
      traitLevel,
      damageType,
      armorObj,
      shieldObj,
      usingShield,
      lethality,
      actor
    );
    templateContext = {
      armor: armorObj,
      shield: shieldObj,
      roll: renderedRoll,
      usingShield: usingShield,
      lethality: lethality,
      type: damageType,
      shieldDamageProtection: shieldDamageProtection,
      armorDamageProtection: armorDamageProtection,
      saveOutcome: outcome.saveOutcome,
      wounds: outcome.wounds,
      DC: lethality - armorDamageProtection - shieldDamageProtection
    };
  }
  chatData = {
    speaker: ChatMessage.getSpeaker(),
    roll: rollResults.roll,
    content: await renderTemplate(messageTemplate, templateContext),
    sound: CONFIG.sounds.dice,
    type: CONST.CHAT_MESSAGE_TYPES.ROLL
  };

  /* Print results to chatlog. */
  ChatMessage.create(chatData);

  game.actors.get(actor).toggleStress(false);
}

/**
 *
 * @param rollTotal
 * @param skillObj
 * @param weaponObj
 * @param damageType
 * @param actorId
 */
function _handleAttack(rollTotal, skillObj, weaponObj, damageType, actorId) {
  /* Calculate details of the attack, such as Lethality and Excess. */
  let excess; let lethality; let skillLevel; let skillName; let weaponDamage;

  excess = parseInt(rollTotal) - 9;

  if (excess < 1) {
    excess = 0;
  }

  if (weaponObj.type === "rangedWeapon") {
    let a = game.actors.get(actorId);
    let ammo = a.items.get(weaponObj.data.selectedAmmo.id);
    lethality = parseInt(ammo.data.data.damage[damageType].value) + excess;
    weaponDamage = parseInt(ammo.data.data.damage[damageType].value);
  } else {
    lethality = parseInt(weaponObj.data.damage[damageType].value) + excess;
    weaponDamage = parseInt(weaponObj.data.damage[damageType].value);
  }

  if (skillObj === null) {
    skillName = "No skill!";
    skillLevel = 0;
  } else {
    skillLevel = skillObj.data.data.skillLevel.value;
    skillName = skillObj.name;
  }

  return {
    skillLevel,
    skillName,
    lethality,
    excess,
    weaponDamage
  };
}

/* Perform a physical save. For details, see TaskCheck above. */
/**
 *
 * @param roll
 * @param traitLevel
 * @param damageType
 * @param armorObj
 * @param shieldObj
 * @param usingShield
 * @param lethality
 * @param actor
 */
function _handleSave(
  roll,
  traitLevel,
  damageType,
  armorObj,
  shieldObj,
  usingShield,
  lethality,
  actor
) {
  let outcome = "";
  let wounds = 0;
  let lethalityValue = lethality;

  /* This is where we calculate the outcome of the save, based
    on input factors. */

  /* First we check to see if there is a block or parry to account for. */
  if (usingShield) {
    lethalityValue -= shieldObj.data.protection[damageType].value;
  }

  /* Then we account for armor. */
  if (armorObj !== null) {
    lethalityValue -= armorObj.data.protection[damageType].value;

  }

  if (lethalityValue < 0) {
    lethalityValue = 0;
  }

  let totalRoll = roll + traitLevel;

  /* Set up limits for fumble and perfection */
  let fumbleLimit = parseInt(lethalityValue) - 10;
  let perfectionLimit = parseInt(lethalityValue) + 10;

  /* Calculate outcome and adjust Shock values accordingly*/
  if (lethalityValue < 1) {
    outcome = "Perfection";
    wounds = 0;
  } else if (totalRoll >= perfectionLimit) {
    outcome = "Perfection";
    wounds = 0;
  } else if (totalRoll > lethalityValue) {
    outcome = "Success";
    wounds = 1;
  } else if (totalRoll < fumbleLimit && fumbleLimit > 0) {
    outcome = "Fumble";
    wounds = 6;
  } else if (totalRoll < lethalityValue) {
    outcome = "Failure";
    wounds = 2;
  } else if (totalRoll === lethalityValue) {
    outcome = "StatusQuo";
    wounds = 2;
  }

  /* Catch automatic failure. */
  if (!outcome === "Fumble" && roll === 0) {
    outcome = "Failure";
    shockValue *= 2;
    wounds = 2;
  }

  /* Update the actor with the values from the save. */
  let actorObj = game.actors.get(actor);

  if (shockValue > 0) {
    actorObj.modifyShock(shockValue);
  }

  if (wounds > 0) {
    actorObj.modifyWounds(wounds);
  }

  return {
    shockResult: shockValue,
    saveOutcome: outcome,
    wounds: wounds
  };
}
