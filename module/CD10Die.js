/**
 * Extend the basic Die class in order to include CD10 mechanics and change it to 0-9 D10.
 * @extends {Die}
 */
export class CeleniaDie extends Die {
  constructor(termData = {}) {
    // Determine if nines can explode infinitely nor not, based on game setting and add rerolling on zeroes.
    const explode = game.settings.get("cd10", "explodingNines") ? "x" : "xo";
    termData.modifiers = [
      `${explode}9`,
      "r0"
    ];
    termData.faces = 10;

    super(termData);
  }

  /** @override */
  static DENOMINATION = "r";

  // Add to the default roll function by adding number of nines and changing 10 to 0.
  roll() {
    const roll = {result: undefined, active: true, nines: 0};
    roll.result = Math.ceil(CONFIG.Dice.randomUniform() * this.faces);

    if (roll.result === 10) {
      roll.result = 0;
    }

    if (roll.result === 9) {
      roll.nines += 1;
    }
    this.results.push(roll);
    return roll;
  }

  // We're copying the default reroll function here, to add a check to only reroll the very first zero rolled.
  reroll(modifier, {recursive=false}={}) {
    // If this isn't the first zero rolled, skip rerolling it, since CD10 only rerolls a "naked" zero.
    for (const result of this.results) {
      if (this.results[0].result !== 0) {
        return;
      }
    }

    // Match the re-roll modifier
    const rgx = /rr?([0-9]+)?([<>=]+)?([0-9]+)?/i;
    const match = modifier.match(rgx);
    if ( !match ) return false;
    let [max, comparison, target] = match.slice(1);

    // If no comparison or target are provided, treat the max as the target
    if ( max && !(target || comparison) ) {
      target = max;
      max = null;
    }

    // Determine target values
    max = Number.isNumeric(max) ? parseInt(max) : null;
    target = Number.isNumeric(target) ? parseInt(target) : 1;
    comparison = comparison || "=";

    // Recursively reroll until there are no remaining results to reroll
    let checked = 0;
    let initial = this.results.length;
    while ( checked < this.results.length ) {
      let r = this.results[checked];
      checked++;
      if (!r.active) continue;

      // Maybe we have run out of rerolls
      if ( (max !== null) && (max <= 0) ) break;

      // Determine whether to re-roll the result
      if ( DiceTerm.compareResult(r.result, comparison, target) ) {
        r.rerolled = true;
        r.active = false;
        this.roll();
        if ( max !== null ) max -= 1;
      }

      // Limit recursion
      if ( !recursive && (checked >= initial) ) checked = this.results.length;
      if ( checked > 1000 ) throw new Error("Maximum recursion depth for exploding dice roll exceeded");
    }
  }
}
