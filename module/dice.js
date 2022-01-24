/* Core dice roll functions for making skillchecks, attacks and saves. The variable checkType determines
how this class functions. */
export async function TaskCheck({
    actorId = null,
    checkType = null,
    skillObjId = null,
    shieldSkillObjId = null,
    usingShield = false,
    shieldObjId = null,
    posTraitObjId = null,
    negTraitObjId = null,
    weaponObjId = null,
    armorObjId = null,
    lethality = null,
    shock = null,
    damageType = null,
    hitLocation = null,
    heroPoint = false,
    reverseTrait = false,
    modifier = null
} = {}) {

    /* Basic error checking */
    if (checkType === null) {
        ui.notifications.error(`FATAL ERROR! CheckType not set!`)
        return;
    }

    /* Grab the necessary objects */
    let skillObj,
        posTraitObj,
        negTraitObj,
        shieldSkillObj,
        shieldObj,
        weaponObj,
        armorObj;

    if (skillObjId != null) {
        skillObj = game.actors.get(actorId).items.get(skillObjId).data;
    } else {
        skillObj = null
    }
    if (posTraitObjId != null) {
        posTraitObj = game.actors.get(actorId).items.get(posTraitObjId).data;
    } else {
        posTraitObj = null
    }
    if (negTraitObjId != null) {
        negTraitObj = game.actors.get(actorId).items.get(negTraitObjId).data;
    } else {
        negTraitObj = null
    }
    if (shieldSkillObjId != null) {
        shieldSkillObj = game.actors.get(actorId).items.get(shieldSkillObjId).data;
    } else {
        shieldSkillObj = null
    }
    if (shieldObjId != null) {
        shieldObj = game.actors.get(actorId).items.get(shieldObjId).data;
    } else {
        shieldObj = null
    }
    if (weaponObjId != null) {
        weaponObj = game.actors.get(actorId).items.get(weaponObjId).data;
    } else {
        weaponObj = null
    }
    if (armorObjId != null) {
        armorObj = game.actors.get(actorId).items.get(armorObjId).data;
    } else {
        armorObj = null
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
        messageTemplate = "systems/cd10/templates/partials/chat-messages/skill-roll.hbs";
    } else if (checkType === "Attack" || checkType === "SimpleAttack") {
        messageTemplate = "systems/cd10/templates/partials/chat-messages/attack-roll.hbs";
    } else if (checkType === "Save") {
        messageTemplate = "systems/cd10/templates/partials/chat-messages/physical-save.hbs";
    }

    /* Fetch skill level */
    if (skillObjId != null) {
        actionValue = parseInt(skillObj.data.skillLevel.value);
        skillName = skillObj.name;
    } else {
        skillName = null;
    }

    if (checkType != "Simple" || checkType != "SimpleAttack") {
        /* Set up traitvalue for the roll */
        if (posTraitObj != null && negTraitObj != null) {
            /* If both traits are provided, use the sum of them. */
            traitValue = parseInt(posTraitObj.data.skillLevel.value) + parseInt(negTraitObj.data.skillLevel.value);

            /* Set up the traitName variable for the roll message */
            let posName = posTraitObj.name,
                negName = negTraitObj.name;

            traitName = posName.concat(" and ", negName);

        } else if (posTraitObj != null && negTraitObj === null) {
            /* If only a positive trait is provided set traitvalue. */
            traitValue = parseInt(posTraitObj.data.skillLevel.value);
            traitName = posTraitObj.name;
        } else if (posTraitObj === null && negTraitObj != null) {
            traitValue = parseInt(negTraitObj.data.skillLevel.value);
            traitName = negTraitObj.name;
        }

        /* If a traitvalue is set, check if traits were reversed */
        if (reverseTrait && traitValue != null) {
            if (traitValue > 0) {
                traitValue = -Math.abs(traitValue);
            } else {
                traitValue = Math.abs(traitValue);
            }
        }
    }

    /* Set up the rollformula */
    rollFormula = `${baseDice}`;

    if (skillObj != null) {
        if (skillObj.type === "spell" || skillObj.type === "skill") {
            rollFormula += " + @actionValue";
        } else if (skillObj.type === "trait") {
            if (actionValue > 0) {
                rollFormula += " + @actionValue";
            } else if (actionValue < 0) {
                rollFormula += " @actionValue";
            }
        }
    }

    if (posTraitObj != null || negTraitObj != null) {
        if (traitValue > 0) {
            rollFormula += " + @traitValue";
        } else if (traitValue < 0) {
            rollFormula += " @traitValue";
        }
    }

    /* Check if it's a physical skill and modifier is of the type that debilitates only physical */
    if (skillObj != null && checkType != "Save") {
        if (skillObj.data.isPhysical.value && game.actors.get(actorId).getDebilitationType === game.i18n.localize("cd10.injuries.debilitation.physOnly")) {
            rollFormula += " - @modifier";
            modifier = game.actors.get(actorId).getModifier;
        } else if (game.actors.get(actorId).getDebilitationType === game.i18n.localize("cd10.injuries.debilitation.all")) {
            rollFormula += " - @modifier";
            modifier = game.actors.get(actorId).getModifier;
        }
    }

    /* Check if an attempt is being made without possessing the necessary skill. */
    if (skillObj === null && checkType === "Simple" || skillObj === null && checkType === "SimpleAttack") {
        actionValue = 0;
        skillName = "No Skill!";
    }

    if (usingShield) {
        let shieldOutcome = _usingShieldTest(skillObj, shieldSkillObj);
        actionValue = shieldOutcome.actionValue;
        skillName = shieldOutcome.skillName;
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

    let failRoll = false,
        failD10;

    /* Catch the dreaded 0 */
    for (let i = 0; i < rollD10.terms[0].results.length; i++) {
        if (rollD10.terms[0].results[i].result === 10) {
            rollD10._total -= 10;
            failRoll = true;
            console.log("ROLLED A ZERO!");
        }
    }

    if (failRoll) {
        console.log("ROLLING SECOND D10!");
        failD10 = await new Roll(rollFormula, rollData).roll({
            async: true
        });

        for (let i = 0; i < failD10.terms[0].results.length; i++) {
            if (failD10.terms[0].results[i].result === 10) {
                failD10._total -= 10;
            }
        }
    }

    /* Set up the roll message data structures based on checkType. */
    let renderedRoll = await rollD10.render(),
        templateContext = null,
        chatData = null,
        renderedFailRoll = null;


    if (failRoll) {
        renderedFailRoll = await failD10.render();
    }

    if (checkType === "Simple") {
        templateContext = {
            skillName: skillName,
            roll: renderedRoll,
            fail: renderedFailRoll
        }
    } else if (checkType === "Complex") {
        templateContext = {
            skillName: skillName,
            traitName: traitName,
            roll: renderedRoll,
            traitValue: traitValue,
            fail: renderedFailRoll
        }
    } else if (checkType === "SimpleAttack") {
        let attackOutcome = _handleAttack(rollD10._total, skillObj, shieldSkillObj, weaponObj, damageType, usingShield, actorId);
        templateContext = {
            weapon: weaponObj,
            weaponDamage: attackOutcome.weaponDamage,
            weaponShock: attackOutcome.weaponShock,
            roll: renderedRoll,
            lethality: attackOutcome.lethality,
            excess: attackOutcome.excess,
            type: damageType,
            skillName: skillName,
            actionValue: actionValue,
            fail: renderedFailRoll
        }
    } else if (checkType === "Attack") {
        let attackOutcome = _handleAttack(rollD10._total, skillObj, shieldSkillObj, weaponObj, damageType, usingShield, actorId);
        templateContext = {
            weapon: weaponObj,
            weaponDamage: attackOutcome.weaponDamage,
            weaponShock: attackOutcome.weaponShock,
            roll: renderedRoll,
            lethality: attackOutcome.lethality,
            excess: attackOutcome.excess,
            type: damageType,
            skillName: skillName,
            traitName: traitName,
            actionValue: actionValue,
            traitValue: traitValue,
            fail: renderedFailRoll
        }
    } else if (checkType === "Save") {
        let outcome = _handleSave(rollD10._total, traitValue, damageType, armorObj, shieldObj, usingShield, lethality, shock, hitLocation, actorId);
        templateContext = {
            armor: armorObj,
            roll: renderedRoll,
            lethality: lethality,
            type: damageType,
            shockResult: outcome.shockResult,
            saveOutcome: outcome.saveOutcome,
            wounds: outcome.wounds,
            fail: renderedFailRoll
        }

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
}

function _handleAttack(rollTotal, skillObj, shieldSkillObj, weaponObj, damageType, usingShield, actorId) {
    /* Calculate details of the attack, such as Lethality and Excess. */
    let excess,
        lethality,
        weaponDamage,
        weaponShock;

    excess = parseInt(rollTotal) - 9;

    if (excess < 1) {
        excess = 0;
    }

    if (weaponObj.type === "rangedWeapon") {
        let a = game.actors.get(actorId);
        let ammo = a.items.get(weaponObj.data.selectedAmmo.id).data;
        lethality = parseInt(ammo.data.damage[damageType].value) + (excess);
        weaponDamage = parseInt(ammo.data.damage[damageType].value);
        weaponShock = parseInt(ammo.data.damage.shock.value)
    } else {
        lethality = parseInt(weaponObj.data.damage[damageType].value) + (excess);
        weaponDamage = parseInt(weaponObj.data.damage[damageType].value);
        weaponShock = parseInt(weaponObj.data.damage.shock.value);
    }

    return {
        lethality,
        excess,
        weaponDamage,
        weaponShock
    }
}

function _usingShieldTest(skillObj, shieldSkillObj) {

    /* If a shield is equipped: determine which skill is optimal to use by 
    comparing if the shield-using skill is higher than the regular
    attack skill with penalty.
    */

    let actionValueAttack, actionValueShield, attackName, shieldName, actionValue, skillName;

    if (skillObj === null) {
        actionValueAttack = 0;
        attackName = "No skill!"
    } else {
        actionValueAttack = skillObj.data.skillLevel.value;
        attackName = skillObj.name;
    }

    if (shieldSkillObj === null) {
        actionValueShield = 0;
        shieldName = "No skill!"
    } else {
        actionValueShield = shieldSkillObj.data.skillLevel.value;
        shieldName = shieldSkillObj.name;
    }

    if ((actionValueAttack - 2) > actionValueShield) {
        actionValue = actionValueAttack - 2;
        skillName = attackName;
    } else {
        actionValue = actionValueShield;
        skillName = shieldName;
    }

    return {
        skillName,
        actionValue
    }
}
/* Perform a physical save. For details, see TaskCheck above. */
function _handleSave(roll, traitValue, damageType, armorObj, shieldObj, usingShield, lethality, shock, hitLocation, actorId) {

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

    let traitModification = null;
    /* Then we account for traits, if any. */
    if (traitValue != null && traitValue > 0) {
        traitModification = traitValue;
    } else if (traitValue != null && traitValue < 0) {
        traitModification = traitValue;
    }

    saveResult = roll - lethalityValue + traitModification;

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
        outcome = "Fumble"
        shockValue *= 3;
        wounds = 6;
    } else if (saveResult < lethalityValue) {
        outcome = "Failure"
        shockValue *= 2;
        wounds = 2;
    } else if (saveResult = lethalityValue) {
        outcome = "StatusQuo"
        wounds = 2;
        shockValue *= 2;
    }

    /* Catch automatic failure. */
    if (!outcome === "Fumble" && roll === 0) {
        outcome = "Failure"
        shockValue *= 2;
        wounds = 2;
    }

    /* Update the actor with the values from the save. */
    let actorObj = game.actors.get(actorId);

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
    }
}