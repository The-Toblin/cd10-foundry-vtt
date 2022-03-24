/* Core dice roll functions for making skillchecks, attacks and saves. The variable checkType determines
how this class functions. */
export async function TaskCheck({
  actor = null,
  checkType = null,
  skillObj = null,
  traitObj = null,
  traitReversed = null,
  usingShield = false,
  shieldObj = null,
  weaponObj = null,
  armorObj = null,
  lethality = null,
  shock = null,
  damageType = null,
  heroPoint = false,
  modifier = null,
} = {}) {
  /* Basic error checking */
  if (checkType === null) {
    ui.notifications.error(`FATAL ERROR! CheckType not set!`);
    return;
  }

  /* Set up base dice formula based on if it's a hero point check or not. 
    Also set up required variables. */

  let baseDice = heroPoint === true ? "2d10x9" : "1d10x9",
    rollFormula = null,
    rollData = null,
    skillName = null,
    traitName = null,
    actionValue = null,
    traitValue = null;

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
  if (skillObj != null) {
    actionValue = parseInt(skillObj.data.data.skillLevel.value);
    skillName = skillObj.name;
  } else {
    skillName = null;
  }

  /* Set up traitvalue for the roll */
  if (traitObj != null) {
    traitName = traitObj.name;
    traitValue = Math.abs(traitObj.data.data.skillLevel.value);

    if (traitReversed) {
      traitValue = -Math.abs(traitValue);
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

  if (modifier > 0 && checkType != "Save") {
    rollFormula += " - @modifier";
  }

  /* Check if an attempt is being made without possessing the necessary skill. */
  if (
    (skillObj === null && checkType === "Simple") ||
    (skillObj === null && checkType === "SimpleAttack")
  ) {
    actionValue = 0;
    skillName = "No Skill!";
  }

  rollData = {
    actionValue: actionValue,
    traitValue: traitValue,
    modifier: modifier,
  };

  /* Roll the dice. Save as object for manipulation. */
  let rollD10 = await new Roll(rollFormula, rollData).roll({
    async: true,
  });

  /* Catch the dreaded 0 */
  for (let i = 0; i < rollD10.terms[0].results.length; i++) {
    if (rollD10.terms[0].results[i].result === 10) {
      rollD10._total -= 10;
    }
  }

  /* Set up the roll message data structures based on checkType. */
  let renderedRoll = await rollD10.render(),
    templateContext = null,
    chatData = null;

  if (checkType === "Simple") {
    templateContext = {
      skillName: skillName,
      traitName: traitName,
      traitValue: traitValue,
      roll: renderedRoll,
    };
  } else if (checkType === "Complex") {
    templateContext = {
      skillName: skillName,
      traitName: traitName,
      roll: renderedRoll,
      traitValue: traitValue,
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
      actionValue: attackOutcome.actionValue,
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
      traitValue: traitValue,
    };
  } else if (checkType === "Save") {
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
      roll: renderedRoll,
      lethality: lethality,
      type: damageType,
      shockResult: outcome.shockResult,
      saveOutcome: outcome.saveOutcome,
      wounds: outcome.wounds,
    };
  }
  chatData = {
    speaker: ChatMessage.getSpeaker(),
    roll: rollD10,
    content: await renderTemplate(messageTemplate, templateContext),
    sound: CONFIG.sounds.dice,
    type: CONST.CHAT_MESSAGE_TYPES.ROLL,
  };

  /* Print results to chatlog. */
  ChatMessage.create(chatData);
}

function _handleAttack(rollTotal, skillObj, weaponObj, damageType, actorId) {
  /* Calculate details of the attack, such as Lethality and Excess. */
  let excess, lethality, actionValue, skillName, weaponDamage, weaponShock;

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
    weaponShock,
  };
}

/* Perform a physical save. For details, see TaskCheck above. */
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
  let outcome = "",
    wounds = 0,
    saveResult = 0,
    lethalityValue = lethality,
    shockValue = shock;

  /* This is where we calculate the outcome of the save, based
    on input factors. */

  /* First we check to see if there is a block or parry to account for. */
  if (usingShield) {
    lethalityValue -= shieldObj.data.protection[damageType].value;
    shockValue -= shieldObj.data.protection.shock.value;
  }

  /* Then we account for armor. */
  if (armorObj != null) {
    lethalityValue -= armorObj.data.protection[damageType].value;
    shockValue -= armorObj.data.protection.shock.value;
  }

  saveResult = roll - lethalityValue + traitValue;

  /* Set up limits for fumble and perfection */
  let fumbleLimit = parseInt(lethalityValue) - 10,
    perfectionLimit = parseInt(lethalityValue) + 10;

  if (shockValue <= 0) {
    shockValue = 1;
  }
  /* Calculate outcome and adjust Shock values accordingly*/
  if (saveResult >= perfectionLimit) {
    outcome = "Perfection";
    shockValue = 1;
    wounds = 0;
  } else if (saveResult > lethalityValue) {
    outcome = "Success";
    wounds = 1;
  } else if (saveResult < fumbleLimit) {
    outcome = "Fumble";
    shockValue *= 3;
    wounds = 6;
  } else if (saveResult < lethalityValue) {
    outcome = "Failure";
    shockValue *= 2;
    wounds = 2;
  } else if ((saveResult = lethalityValue)) {
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
    wounds: wounds,
  };
}
