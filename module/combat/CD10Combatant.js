export default class CD10Combatant extends Combatant {
  _getInitiativeFormula(combatant) {
    // FIXME: Rewrite this shit to fit the new setup, and check all the data pathways.
    let baseFormula = super._getInitiativeFormula(combatant);
    const scene = game.scenes.get(this.data.sceneId);
    const token = scene.tokens.get(this.data.tokenId);

    let weapon = null;
    let skill = null;
    let skillValue = 0;
    let modifier = token._actor.system.modifier.value;

    for (const item of token._actor.data.items) {
      if (item.type === "meleeWeapon" || (item.type === "rangedWeapon" && item.system.isEquipped?.value)) {
        weapon = item;
      }
    }

    for (const item of token._actor.data.items) {
      if (item.type === "skill") {
        if (item.system.matchID === weapon.system.attackSkill.value) {
          skill = item;
        }
      }
    }

    skillValue = skill.system.skillLevel.value;

    if (skillValue !== null) {
      baseFormula += ` + ${skillValue}`;
    }
    if (modifier > 0) {
      baseFormula += ` - ${modifier}`;
    }

    return baseFormula;
  }
}
