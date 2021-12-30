/* Core dice roll functions for making skillchecks, attacks and saves. The variable checkType determines
how this class functions. */
export async function TaskCheck({
    checkType = null,
    skillObj = null,
    shieldSkillObj = null,
    usingShield = false,
    posTraitObj = null,
    negTraitObj = null,
    weaponObj = null,
    armorObj = null,
    lethality = null,
    shock = null,
    damageType = null,
    heroPoint = false,
    reverseTrait = false,
    modifier = null
} = {}) {

    /* Basic error checking */
    if (checkType === null) {
        ui.notifications.error(`FATAL ERROR! CheckType not set!`)
        return
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
        messageTemplate = "systems/cd10/templates/partials/skill-roll.hbs";
    } else if (checkType === "Attack" || checkType === "SimpleAttack") {
        messageTemplate = "systems/cd10/templates/partials/attack-roll.hbs";
    } else if (checkType === "Save") {
        messageTemplate = "systems/cd10/templates/partials/physical-save.hbs";
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

    if (skillObj != null) {
        rollFormula += " + @actionValue";
    }

    if (posTraitObj != null || negTraitObj != null) {
        if (traitValue > 0) {
            rollFormula += " + @traitValue";
        } else if (traitValue < 0) {
            rollFormula += " @traitValue";
        }
    }

    if (modifier > 0) {
        rollFormula += " - @modifier";
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
    let renderedRoll = await rollD10.render(),
        templateContext = null,
        chatData = null;

    if (checkType === "Simple") {
        templateContext = {
            skillName: skillName,
            roll: renderedRoll
        }
    } else if (checkType === "Complex") {
        templateContext = {
            skillName: skillName,
            traitName: traitName,
            roll: renderedRoll,
            traitValue: traitValue
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
            actionValue: attackOutcome.actionValue
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
            traitValue: traitValue
        }
    } else if (checkType === "Save") {
        templateContext = {
            armor: armorObj,
            roll: renderedRoll,
            lethality: lethality,
            type: damageType,
            shockResult: shockResult,
            saveOutcome: outcome
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

    /* If the check was a save, return the necessary values to update the actor. */
    if (checkType === "Save") {
        return {
            result: saveResult,
            shock: shockResult,
            saveOutcome: outcome
        }
    }
}

function _handleAttack(rollTotal, skillObj, shieldSkillObj, weaponObj, damageType, usingShield) {
    /* Calculate details of the attack, such as Lethality and Excess. */
    let excess,
        lethality,
        actionValue,
        skillName;

    excess = parseInt(rollTotal) - 9

    if (excess < 1) {
        excess = 0;
    }

    lethality = parseInt(weaponObj.data.damage[damageType].value) + (excess);

    if (usingShield) {
        /* If a shield is equipped: determine which skill is optimal to use by 
        comparing if the shield-using skill is higher than the regular
        attack skill with penalty.
        */

        let actionValueAttack = skillObj.data.skillLevel.value,
            actionValueShield = shieldSkillObj.data.skillLevel.value;

        if ((actionValueAttack - 3) > actionValueShield) {
            actionValue = actionValueAttack - 3;
            skillName = skillObj.name;
        } else {
            actionValue = actionValueShield;
            skillName = shieldSkillObj.name;
        }
    } else {
        actionValue = skillObj.data.skillLevel.value;
        skillName = skillObj.name;
    }

    return {
        actionValue,
        skillName,
        lethality,
        excess
    }
}

/* Perform a physical save. Done when you click a protection type on an armor card.
For details, see TaskCheck above. */
export async function PhysicalSave({
    traitValue = null,
    heroPoint = false,
    reverseTrait = false,
    armor = null,
    damageType = null,
    lethality = null,
    shock = null
} = {}) {

    const messageTemplate = "systems/cd10/templates/partials/physical-save.hbs";

    let rollFormula,
        baseDice = heroPoint === true ? "2d10x9" : "1d10x9",
        rollData,
        outcome;

    if (traitValue === null) {
        rollFormula = `${baseDice}`;
    } else {
        rollFormula = `${baseDice} + @traitValue`;
    }

    if (reverseTrait) {
        rollData = {
            traitValue: -traitValue,
        };
    } else {
        rollData = {
            traitValue: traitValue,
        };
    }

    let rollD10 = new Roll(rollFormula, rollData).roll({
        async: false
    });

    /* Catch the dreaded 0 */
    for (let i = 0; i < rollD10.terms[0].results.length; i++) {

        if (rollD10.terms[0].results[i].result === 10) {
            rollD10._total -= 10;
        }
    }

    let renderedRoll = await rollD10.render(),
        saveResult = parseInt(rollD10._total) + parseInt(armor.data.data.protection[damageType].value),
        shockResult = shock - parseInt(armor.data.data.protection.shock.value);

    /* Catch smaller than 0 Shockresults */

    if (shockResult < 0) {
        shockResult = 0;
    }

    /* Set up limits for fumble and perfection */
    let fumbleLimit = parseInt(lethality) - 10,
        perfectionLimit = parseInt(lethality) + 10;

    /* Calculate outcome and adjust Shock values accordingly*/
    if (saveResult >= perfectionLimit) {
        outcome = "Perfection";
        shockResult = 1;
    } else if (saveResult > lethality) {
        outcome = "Success"
    } else if (saveResult < fumbleLimit) {
        outcome = "Fumble"
        shockResult *= 3;
    } else if (saveResult < lethality) {
        outcome = "Failure"
        shockResult *= 2;
    } else if (saveResult = lethality) {
        outcome = "StatusQuo"
    }

    let templateContext = {
            armor: armor,
            roll: renderedRoll,
            lethality: lethality,
            type: damageType,
            shock: shock,
            shockResult: shockResult,
            saveOutcome: outcome
        },
        chatData = {
            speaker: ChatMessage.getSpeaker(),
            roll: rollD10,
            content: await renderTemplate(messageTemplate, templateContext),
            sound: CONFIG.sounds.dice,
            type: CONST.CHAT_MESSAGE_TYPES.ROLL
        };

    ChatMessage.create(chatData);

    /* Return the necessary values to adjust the values on the character. */
    return {
        result: saveResult,
        shock: shockResult,
        saveOutcome: outcome
    }
}