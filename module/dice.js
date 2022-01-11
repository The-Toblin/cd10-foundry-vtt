/* Core dice roll functions for making skillchecks, attacks and saves. The variable checkType determines
how this class functions. */
export async function TaskCheck({
    actor = null,
    checkType = null,
    skillObj = null,
    shieldSkillObj = null,
    usingShield = false,
    shieldObj = null,
    posTraitObj = null,
    negTraitObj = null,
    weaponObj = null,
    armorObj = null,
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
    if (skillObj != null) {
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
            traitValue = -Math.abs(traitValue);
        }
    }

    /* Set up the rollformula */
    rollFormula = `${baseDice}`;

    if (skillObj != null && skillObj.type === "skill") {
        rollFormula += " + @actionValue";
    } else if (skillObj != null && skillObj.type === "trait") {
        if (actionValue > 0) {
            rollFormula += " + @actionValue";
        } else if (actionValue < 0) {
            rollFormula += " @actionValue";
        }
    }

    if (posTraitObj != null || negTraitObj != null) {
        if (traitValue > 0) {
            rollFormula += " + @traitValue";
        } else if (traitValue < 0) {
            rollFormula += " @traitValue";
        }
    }

    if (modifier > 0 && checkType != "Save") {
        rollFormula += " - @modifier";
    }

    /* Check if an attempt is being made without possessing the necessary skill. */
    if (skillObj === null && checkType === "Simple" || skillObj === null && checkType === "SimpleAttack") {
        actionValue = 0;
        skillName = "No Skill!";
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
        }
    }

    if (failRoll) {
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
        renderedFailRoll = failD10;
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
        let attackOutcome = _handleAttack(rollD10._total, skillObj, shieldSkillObj, weaponObj, damageType, usingShield);
        templateContext = {
            weapon: weaponObj,
            roll: renderedRoll,
            lethality: attackOutcome.lethality,
            excess: attackOutcome.excess,
            type: damageType,
            skillName: attackOutcome.skillName,
            actionValue: attackOutcome.actionValue,
            fail: renderedFailRoll
        }
    } else if (checkType === "Attack") {
        let attackOutcome = _handleAttack(rollD10._total, skillObj, shieldSkillObj, weaponObj, damageType, usingShield);
        templateContext = {
            weapon: weaponObj,
            roll: renderedRoll,
            lethality: attackOutcome.lethality,
            excess: attackOutcome.excess,
            type: damageType,
            skillName: attackOutcome.skillName,
            traitName: traitName,
            actionValue: attackOutcome.actionValue,
            traitValue: traitValue,
            fail: renderedFailRoll
        }
    } else if (checkType === "Save") {
        let outcome = _handleSave(rollD10._total, traitValue, damageType, armorObj, shieldObj, usingShield, lethality, shock, hitLocation, actor);
        console.log(outcome);
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

function _handleAttack(rollTotal, skillObj, shieldSkillObj, weaponObj, damageType, usingShield) {
    /* Calculate details of the attack, such as Lethality and Excess. */
    let excess,
        lethality,
        actionValue,
        skillName;

    excess = parseInt(rollTotal) - 9;

    if (excess < 1) {
        excess = 0;
    }

    lethality = parseInt(weaponObj.data.damage[damageType].value) + (excess);

    if (usingShield) {
        /* If a shield is equipped: determine which skill is optimal to use by 
        comparing if the shield-using skill is higher than the regular
        attack skill with penalty.
        */

        let actionValueAttack, actionValueShield, attackName, shieldName;

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

        if ((actionValueAttack - 3) > actionValueShield) {
            actionValue = actionValueAttack - 3;
            skillName = attackName;
        } else {
            actionValue = actionValueShield;
            skillName = shieldName;
        }
    } else {
        if (skillObj === null) {
            skillName = "No skill!";
            actionValue = 0;
        } else {
            actionValue = skillObj.data.skillLevel.value;
            skillName = skillObj.name;
        }
    }

    return {
        actionValue,
        skillName,
        lethality,
        excess
    }
}

/* Perform a physical save. For details, see TaskCheck above. */
function _handleSave(roll, traitValue, damageType, armorObj, shieldObj, usingShield, lethality, shock, hitLocation, actor) {

    let outcome = "",
        wounds = 0,
        saveResult = 0,
        lethalityValue = lethality,
        shockValue = shock;

    console.log("Roll: ", roll);
    console.log("TraitValue: ", traitValue);
    console.log("DamageType: ", damageType);
    if (armorObj != null) {
        console.log("Armor: ", armorObj.name);
    }
    if (shieldObj != null) {
        console.log("Shield: ", shieldObj.name);
    }
    console.log("Lethality: ", lethalityValue);
    console.log("Shock: ", shock);
    console.log("Hit Location: ", hitLocation);

    /* This is where we calculate the outcome of the save, based
    on input factors. */

    /* First we check to see if there is a block or parry to account for. */
    if (usingShield) {
        console.log(`Removing ${shieldObj.data.protection[damageType].value} Lethality due to ${shieldObj.name}`)
        console.log(`Removing ${shieldObj.data.protection.shock.value} Shock due to ${shieldObj.name}`)
        lethalityValue -= shieldObj.data.protection[damageType].value;
        shockValue -= shieldObj.data.protection.shock.value;
    }

    /* Then we account for armor. */
    if (armorObj != null) {
        console.log(`Removing ${armorObj.data.protection[damageType].value} Lethality due to ${armorObj.name}`)
        console.log(`Removing ${armorObj.data.protection.shock.value} Shock due to ${armorObj.name}`)
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

    console.log("Roll value:", roll);
    console.log("Lethality Left:", lethalityValue);
    saveResult = roll - lethalityValue + traitModification;
    console.log("Save Result: ", saveResult);

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

    console.log("Outcome: ", outcome);
    console.log("Final shock: ", shockValue);
    console.log("Wounds: ", wounds);
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
    }
}