export default class CD10Combatant extends Combatant {
  _getInitiativeFormula(combatant) {
    const superFormula = super._getInitiativeFormula(combatant);
    let baseFormula = (superFormula === !undefined ? superFormula : super._getInitiativeFormula(this));

    const scene = game.scenes.get(this.data.sceneId);
    const token = scene.tokens.get(this.data.tokenId);

    let weapon = null;
    let skill = null;
    let skillValue = 0;
    const modifier = token._actor.data.data.modifier.value;

    for (const item of token._actor.data.items) {
      if (item.type === "meleeWeapon" || item.type === "rangedWeapon") {
        if (item.data.data.isEquipped?.value) weapon = item;
      }
    }

    for (const item of token._actor.data.items) {
      if (item.type === "skill") {
        if (item.data.data.matchID === weapon.data.data.attackSkill.value) skill = item;
      }
    }

    skillValue = skill.data.data.skillLevel.value;

    if (skillValue !== null) baseFormula += ` + ${skillValue}`;

    if (modifier > 0) baseFormula += ` - ${modifier}`;

    return baseFormula;
  }
}
