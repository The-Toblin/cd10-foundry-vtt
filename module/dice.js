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
 * @param root0.shock
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
  shock = 0,
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
  let actionValue = null;
  let traitValue = null;

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
    actionValue = parseInt(skillObj.data.data.skillLevel.value);
    skillName = skillObj.name;
  } else {
    skillName = null;
  }

  /* Set up traitvalue for the roll */
  if (traitObj !== null) {
    traitName = traitObj.name;
    traitValue = parseInt(traitObj.data.data.skillLevel.value);

    if (traitReversed) {
      traitValue *= -1;
    }
  }

  /* Set up the rollformula */
  rollFormula = `${baseDice}`;

  if (actionValue > 0) {
    rollFormula += " + @actionValue";
  }

  if (traitValue > 0) {
    rollFormula += " + @traitValue";
  } else if (traitValue < 0) {
    rollFormula += " @traitValue";
  }

  if (modifier > 0 && checkType !== "Save") {
    rollFormula += " - @modifier";
  }

  /* Check if an attempt is being made without possessing the necessary skill. */
  if (checkType === "Simple" || checkType === "SimpleAttack") {
    if (skillObj === null && traitObj !== null) {
      skillName = traitObj.name;
    } else if (skillObj === null && traitObj === null) {
      actionValue = 0;
      skillName = "No Skill!";
    }
  }

  rollData = {
    actionValue: actionValue,
    traitValue: traitValue,
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
      traitValue: traitValue,
      roll: renderedRoll
    };
  } else if (checkType === "Complex") {
    templateContext = {
      skillName: skillName,
      traitName: traitName,
      roll: renderedRoll,
      traitValue: traitValue
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
      weaponShock: attackOutcome.weaponShock,
      roll: renderedRoll,
      lethality: attackOutcome.lethality,
      excess: attackOutcome.excess,
      type: damageType,
      skillName: attackOutcome.skillName,
      actionValue: attackOutcome.actionValue
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
      weaponShock: attackOutcome.weaponShock,
      roll: renderedRoll,
      lethality: attackOutcome.lethality,
      excess: attackOutcome.excess,
      type: damageType,
      skillName: attackOutcome.skillName,
      traitName: traitName,
      actionValue: attackOutcome.actionValue,
      traitValue: traitValue
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
      traitValue,
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
  let excess; let lethality; let actionValue; let skillName; let weaponDamage; let weaponShock;

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
    actionValue = 0;
  } else {
    actionValue = skillObj.data.data.skillLevel.value;
    skillName = skillObj.name;
  }

  return {
    actionValue,
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
 * @param traitValue
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
  traitValue,
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

  let totalRoll = roll + traitValue;

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
