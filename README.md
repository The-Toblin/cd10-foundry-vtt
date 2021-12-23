# cd10-foundry-vtt
This is the Celenia D10 TTRPG Ruleset for Foundry VTT.

The CD10 system can be found at https://www.worldanvil.com/w/CD10

Please note that only official releases are considered "stable", meaning that all functions inside them are expected to actually function as advertised. If you download the "latest", meaning the live system directly as it is from the main branch, you are downloading a development build which may not function properly. Be aware of this.

Instructions
Before attempting to use this system, you should be familiar with the rules. See link above.

Skills, Traits and Items
To create skills, traits and items on a character, simply create items in the game system, then drag and drop them on top of the character's sheet. They automatically show up in the proper sections. Skills, spells and traits are all adjusted by using the input box for skillLevel. 

(Please note that active effects from traits and such are not implemented as of version 0.3.0)


Weapons and equipment
Weapons and armor can be equipped from the inventory tab by clicking the "+" symbol, and unequipped by clicking the "-" symbol. You can also equip and unequip using the right-click context menu. Equipment load is automatically calculated and showed on the sheet under "Encumbrance". All characters default to a 12kg encumbrance limit. Future releases will allow species choices, traits etc to affect this value through active effects.
 

Injury handling
Wounds and Shock is added by left-clicking on respective bar. Right clicking removes a pip. Debilitation is automatically calculated and displayed.


Combat quirks
Rudimentary support for Stressing is implemented. Right now it's a tickbox in the Combat tab of the sheet. You must remember to turn it off yourself, but in future versions, it'll be an active effect triggered in combat and will auto clear itself.


Automated Skill checks
Single-click on the roll-icon (a D10 that shows up on Skill/Weapon/Spell mouse-over) will perform a skill check with that skill, taking into account any debilitation, and post the results as a default roll message in chat. (Spells not yet included, coming in future release)

Spending Hero Points on rolls
Shift-click on the roll icon performs a hero-point boosted skill check in the same manner, first checking to see there are experience points to spend and deducting one. If there isn't enough experience to make a hero-point check, an error dialog shows instead.

Complex Checks
For complex checks (involving traits), click the "Complex Check" button on the sheet to get a dialog where you can configure the roll, selecting skill and trait, as well as if it should be a hero point check and/or reverse the trait.

 
Attack Checks
To make attack checks, left click (or shift-click for heropoint) on the damage type of your weapon (on the weapon card). An attack is automatically rolled.

Physical Saves
To make physical saves, left click on the damage type (of the attack) on your armor card. A dialog opens to allow you to configure your save. Wounds and Shock is automatically handled. (This will be reworked in a future version to automatically take armor in mind, not requiring you to click any armor pieces, but just perform a save and it'll take everything into account.)