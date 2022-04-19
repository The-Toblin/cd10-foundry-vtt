/**
 * Core Dice roller class for handling all types of checks.
 * Contains helper functions for resolving things necessary for checks.
 *
 * Exports three functions for handling basic skill checks, attack checks
 * and physical saves.
 */

/**
 * Creates the RollFormula for use in dicerolls, based on the data delivered to it.
 * @param {number} skillLevel (opt)
 * @param {number} traitLevel (opt)
 * @param {number} modifier (opt)
 * @param {boolean} save (opt)
 * @param {boolean} heroPoint (opt)
 * @returns {Promise/String}
 */
const createDiceFormula = async (skillLevel = 0, traitLevel = 0, modifier = 0, save = false, heroPoint = false) => {
  const baseDice = heroPoint === true ? "2d10x9" : "1d10x9";
  let rollFormula = `${baseDice}`;

  if (skillLevel > 0) rollFormula += " + @skillLevel";

  rollFormula += traitLevel > 0 ? " + @traitLevel" : " @traitLevel";

  if (modifier > 0 && !save) rollFormula += " - @modifier";

  return rollFormula;
};

const createRollData = async (skillLevel = null, traitLevel = null, modifier = null) => {
  return {
    skillLevel: skillLevel,
    traitLevel: traitLevel,
    modifier: modifier
  };
};

const doCD10Roll = async (rollFormula, rollData) => {
  const cd10Roll = new Roll(rollFormula, rollData);
  await cd10Roll.evaluate({async: true});

  // Turn the 1-10 d10s into a 0-9 d10s
  for (let i = 0; i < cd10Roll.terms[0].results.length; i++) {
    cd10Roll.terms[0].results[i].result -= 1;
  }

  return cd10Roll;
};

/**
 * Evaluator function. Evaluates the rolldata delivered to it. It adds the total together,
 * rerolls any zeroes and returns the object holding the evaluated data.
 * @param {Array} rollResults Holds the rolled results.
 * @returns {Promise/Object} The finished evaluation object.
 */
const evaluateRoll = async rollResults => {
  let totalResult = 0;
  let rolledZero = false;

  if (rollResults[0] === 0) {
    const reRoll = await doCD10Roll("1d10x9");
    rolledZero = true;

    for (const reRollObj of reRoll.terms[0].results) {
      rollResults.push(reRollObj.result);
    }
  }

  for (const diceResult of rollResults) {
    totalResult += diceResult;
  }

  return {
    rollResults: rollResults,
    total: totalResult,
    rolledZero: rolledZero
  };
};

/**
 * Helper function for the roll renderer. Creates a list of rolled dice
 * marking 0's as failures (red) and 9's as successes (green).
 * @param {Array} diceRolls The object holding all the rolls.
 * @returns {Promise/HTML} HTML list segment for use in chatdata.
 */
const diceList = async diceRolls => {
  const results = {
    0: '<li class="roll die d10 failure">',
    9: '<li class="roll die d10 success">'
  };

  let rolledList = "";

  for (const roll of diceRolls ) {
    rolledList += `${results[roll.result] || '<li class="roll die d10">'} ${roll.result} </li>`;
  }
  return rolledList;
};

const renderskillCheckRoll = async cd10Roll => {

};

const renderAttackRoll = async cd10Roll => {

};

const renderSaveRoll = async cd10Roll => {

};

const createRollRenderTemplate = async () => {
  const renderTemplate = "";

  return rollTemplate;
};

const getSkillData = async (actorId = null, skillId = null) => {
  if (skillId !== null && actorId !== null) {
    const skill = game.actors.get(actorId).items.get(skillId);
    return {
      skillLevel: parseInt(skill.data.data.skillLevel.value),
      skillName: skill.name
    };
  } else {
    return {
      skillLevel: 0,
      skillName: "No skill!"
    };
  }
};

const getTraitData = async (actorId = null, traitId = null) => {
  if (traitId !== null && actorId !== null) {
    const trait = game.actors.get(actorId).items.get(skillId);
    const traitLevel = parseInt(trait.data.data.skillLevel.value);
    const reversed = trait.data.data.reversed.value;
    return {
      traitLevel: reversed ? (traitLevel * -1) : traitLevel,
      traitName: trait.name
    };
  } else {
    return {
      traitLevel: 0,
      traitName: null
    };
  }
};


export const SkillCheck = async (actorId = null, skillId = null, traitId = null, heroPoint = false) => {
  const messageTemplate = "systems/cd10/templates/partials/chat-messages/skill-check.hbs";

};

export const AttackCheck = async (actorId = null, skillId = null, traitId = null, heroPoint = false) => {
  const messageTemplate = "systems/cd10/templates/partials/chat-messages/attack-check.hbs";

};

export const Save = async (actorId = null, traitId = null, heroPoint = false, lethality = 0, damageType = "slash") => {
  const messageTemplate = "systems/cd10/templates/partials/chat-messages/save.hbs";
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
export async function simplecheck({
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

  let baseDice = heroPoint === true ? "2d10x9" : "1d10x9";
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
      "systems/cd10/templates/partials/chat-messages/skill-roll.hbs";
  } else if (checkType === "Attack" || checkType === "SimpleAttack") {
    messageTemplate =
      "systems/cd10/templates/partials/chat-messages/attack-roll.hbs";
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
  let rollD10 = await new Roll(rollFormula, rollData).roll({
    async: true
  });

  /* Catch the dreaded 0 */
  for (let i = 0; i < rollD10.terms[0].results.length; i++) {
    if (rollD10.terms[0].results[i].result === 10) {
      rollD10._total -= 10;
    }
  }

  /* Set up the roll message data structures based on checkType. */
  let renderedRoll = await rollD10.render();
  let templateContext = null;
  let chatData = null;

  if (checkType === "Simple") {
    templateContext = {
      skillName: skillName,
      traitName: traitName,
      traitLevel: traitLevel,
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
      rollD10._total,
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
      skillLevel: attackOutcome.skillLevel
    };
  } else if (checkType === "Attack") {
    let attackOutcome = _handleAttack(
      rollD10._total,
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
    let shieldShockProtection = 0;
    let armorDamageProtection = 0;
    let armorShockProtection = 0;

    if (armorObj !== null) {
      armorDamageProtection = armorObj.data.protection[damageType].value;
      armorShockProtection = armorObj.data.protection.shock.value;
    }

    if (usingShield) {
      shieldDamageProtection = shieldObj.data.protection[damageType].value;
      shieldShockProtection = shieldObj.data.protection.shock.value;
    }

    let outcome = _handleSave(
      rollD10._total,
      traitLevel,
      damageType,
      armorObj,
      shieldObj,
      usingShield,
      lethality,
      shock,
      actor
    );
    templateContext = {
      armor: armorObj,
      shield: shieldObj,
      roll: renderedRoll,
      usingShield: usingShield,
      lethality: lethality,
      shock: shock,
      type: damageType,
      shieldDamageProtection: shieldDamageProtection,
      shieldShockProtection: shieldShockProtection,
      armorDamageProtection: armorDamageProtection,
      armorShockProtection: armorShockProtection,
      shockResult: outcome.shockResult,
      saveOutcome: outcome.saveOutcome,
      wounds: outcome.wounds,
      DC: lethality - armorDamageProtection - shieldDamageProtection
    };
  }
  chatData = {
    speaker: ChatMessage.getSpeaker(),
    roll: rollD10,
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
  let excess; let lethality; let skillLevel; let skillName; let weaponDamage; let weaponShock;

  excess = parseInt(rollTotal) - 9;

  if (excess < 1) {
    excess = 0;
  }

  if (weaponObj.type === "rangedWeapon") {
    let a = game.actors.get(actorId);
    let ammo = a.items.get(weaponObj.data.selectedAmmo.id);
    lethality = parseInt(ammo.data.data.damage[damageType].value) + excess;
    weaponDamage = parseInt(ammo.data.data.damage[damageType].value);
    weaponShock = parseInt(ammo.data.data.damage.shock.value);
  } else {
    lethality = parseInt(weaponObj.data.damage[damageType].value) + excess;
    weaponDamage = parseInt(weaponObj.data.damage[damageType].value);
    weaponShock = parseInt(weaponObj.data.damage.shock.value);
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
    weaponDamage,
    weaponShock
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
 * @param shock
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
  shock,
  actor
) {
  let outcome = "";
  let wounds = 0;
  let lethalityValue = lethality;
  let shockValue = shock;

  /* This is where we calculate the outcome of the save, based
    on input factors. */

  /* First we check to see if there is a block or parry to account for. */
  if (usingShield) {
    lethalityValue -= shieldObj.data.protection[damageType].value;
    shockValue -= shieldObj.data.protection.shock.value;
  }

  /* Then we account for armor. */
  if (armorObj !== null) {
    lethalityValue -= armorObj.data.protection[damageType].value;
    shockValue -= armorObj.data.protection.shock.value;

  }

  if (lethalityValue < 0) {
    lethalityValue = 0;
  }

  let totalRoll = roll + traitLevel;

  /* Set up limits for fumble and perfection */
  let fumbleLimit = parseInt(lethalityValue) - 10;
  let perfectionLimit = parseInt(lethalityValue) + 10;

  if (shockValue <= 0) {
    shockValue = 1;
  }
  /* Calculate outcome and adjust Shock values accordingly*/
  if (lethalityValue < 1) {
    outcome = "Perfection";
    shockValue = 1;
    wounds = 0;
  } else if (totalRoll >= perfectionLimit) {
    outcome = "Perfection";
    shockValue = 1;
    wounds = 0;
  } else if (totalRoll > lethalityValue) {
    outcome = "Success";
    wounds = 1;
  } else if (totalRoll < fumbleLimit && fumbleLimit > 0) {
    outcome = "Fumble";
    shockValue *= 3;
    wounds = 6;
  } else if (totalRoll < lethalityValue) {
    outcome = "Failure";
    shockValue *= 2;
    wounds = 2;
  } else if (totalRoll === lethalityValue) {
    outcome = "StatusQuo";
    wounds = 2;
    shockValue *= 2;
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
