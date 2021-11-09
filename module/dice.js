export function TaskCheck({
    actionValue = null,
    traitValue = null,
    heroPoint = false,
    reverseTrait = false,
    modifier = null
} = {}) {
    let baseDice = heroPoint === true ? "2d10x9" : "1d10x9";
    let rollFormula = `${baseDice} + @actionValue + @traitValue - @modifier`;

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

    let rollD10 = new Roll(rollFormula, rollData).roll();

    /* Catch the dreaded 0 */
    for (let i = 0; i < rollD10.terms[0].results.length; i++) {

        if (rollD10.terms[0].results[i].result === 10) {
            rollD10._total -= 10;
        }
    }
    rollD10.toMessage(messageData);
}