export function TaskCheck({
    actionValue = null,
    traitValue = null,
    heroPoint = false,
    reverseTrait = false,
    modifier = null
} = {}) {
    let baseDice = heroPoint === true ? "2d10x9" : "1d10x9";
    let rollFormula;

    if (traitValue === null && modifier === 0) {
        rollFormula = `${baseDice} + @actionValue`;
    } else if (traitValue === null && modifier != 0) {
        rollFormula = `${baseDice} + @actionValue - @modifier`;
    } else if (traitValue != null && modifier === 0) {
        rollFormula = `${baseDice} + @actionValue + @traitValue`;
    } else {
        rollFormula = `${baseDice} + @actionValue + @traitValue - @modifier`;
    }

    let rollData;

    if (reverseTrait) {
        rollData = {
            actionValue: actionValue,
            traitValue: -traitValue,
            modifier: modifier
        };
    } else {
        rollData = {
            actionValue: actionValue,
            traitValue: traitValue,
            modifier: modifier
        };
    }

    let messageData = {
        speaker: ChatMessage.getSpeaker()
    };

    let rollD10 = new Roll(rollFormula, rollData).roll({
        async: false
    });

    /* Catch the dreaded 0 */
    for (let i = 0; i < rollD10.terms[0].results.length; i++) {

        if (rollD10.terms[0].results[i].result === 10) {
            rollD10._total -= 10;
        }
    }

    rollD10.toMessage(messageData);

}

export async function AttackCheck({
    actionValue = null,
    traitValue = null,
    heroPoint = false,
    reverseTrait = false,
    modifier = null,
    weapon = null,
    damageType = null
} = {}) {

    const messageTemplate = "systems/cd10/templates/partials/attack-roll.hbs";

    let rollFormula;

    let baseDice = heroPoint === true ? "2d10x9" : "1d10x9";

    if (traitValue === null && modifier === 0) {
        rollFormula = `${baseDice} + @actionValue`;
    } else if (traitValue === null && modifier != 0) {
        rollFormula = `${baseDice} + @actionValue - @modifier`;
    } else if (traitValue != null && modifier === 0) {
        rollFormula = `${baseDice} + @actionValue + @traitValue`;
    } else {
        rollFormula = `${baseDice} + @actionValue + @traitValue - @modifier`;
    }

    let rollData;

    if (reverseTrait) {
        rollData = {
            actionValue: actionValue,
            traitValue: -traitValue,
            modifier: modifier
        };
    } else {
        rollData = {
            actionValue: actionValue,
            traitValue: traitValue,
            modifier: modifier
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

    let lethality = parseInt(rollD10._total) + parseInt(weapon.data.data.damage[damageType].value - 9);
    let excess = parseInt(rollD10._total) - 9;
    let renderedRoll = await rollD10.render();

    let templateContext = {
        weapon: weapon,
        roll: renderedRoll,
        lethality: lethality,
        excess,
        type: damageType
    }

    let chatData = {
        speaker: ChatMessage.getSpeaker(),
        roll: rollD10,
        content: await renderTemplate(messageTemplate, templateContext),
        sound: CONFIG.sounds.dice,
        type: CONST.CHAT_MESSAGE_TYPES.ROLL
    };

    ChatMessage.create(chatData);
}

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

    let fumbleLimit = parseInt(lethality) - 10,
        perfectionLimit = parseInt(lethality) + 10;

    /* Calculate outcome */
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
    }

    let chatData = {
        speaker: ChatMessage.getSpeaker(),
        roll: rollD10,
        content: await renderTemplate(messageTemplate, templateContext),
        sound: CONFIG.sounds.dice,
        type: CONST.CHAT_MESSAGE_TYPES.ROLL
    };

    ChatMessage.create(chatData);

    return {
        result: saveResult,
        shock: shockResult,
        saveOutcome: outcome
    }
}