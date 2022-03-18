# Legacy
This version of the Celenia D10 RPG System (CD10) is no longer supported. See https://www.github.com/The-Toblin/cd10-foundry-vtt for the redesigned, modern system. This system remains for legacy support and occasional bugfixes if one would prefer to use the older version.

# Celenia D10 RPG System
CD10 RPG is a narratively focused, settings-agnostic RPG systems meant primarily for immersive verisimilitude games with a touch of rule of cool. CD10 attempts to emulate the feel of an 80's action movie, where the main character is just a human, but also the hero of the story. Imagine your character being John McClane of Die Hard and you get pretty close to the aim of the system. It is not suitable for epic, grand-scale, "save the universe" plots common to more traditional high-fantasy games, although with some fenagling, those campaigns are possible. But just don't try to make big, epic boss battles in this system. It's not made for it. It's designed primarily for equal-footing fighters duking it out, or fighting monsters that are of somewhat similar ability as the characters.

# Core Features
# No base attributes
CD10 offers a character no base attributes (such as Strength, Charisma, Intelligence etc). Instead, the system uses a combination of trainable skills and acquired traits. The skills are where you will find most base attribute-esque things such as athleticism and socialisation, while traits describe everything from the character's physical presence, appearance to their loyalty and societal status. Traits are incredibly flexible and all play into the game, so your character's conviction, personality, fate and quirks all play a mechanical role in the game.

# No hitpoints
CD10 eschews the traditional hit points in favor of a more fluid and vague system. Hitpoints are easy to work with and easy to understand, but provide too much of a game-feeling and hinders immersion. CD10 instead relies on Wounds and Shock to describe how injured a character is. Wounds are accumulated based on physical saves and inflict rising, long-term debilitation on a character. Barely any at first, but keep getting wounded and things stack up fast. Shock is the short-term companion of Wounds and handle things like shock, fatigue, pain and stress. Shock is generally fast to accrue, fast to recover, while Wounds are slower both to gain and to recover.

# High-stakes
In CD10, a character is as likely to die in their first session as in their 100th. Over time, a character gains no resistance to injury, although they can definitely improve their skills as a fighter. Defense is largely in the hands of the character, directly using your combat skills to prevent damage through dodging, parrying or blocking. There is no static AC number. Your skills determine how good you are both at hitting and avoiding getting hit. Equipment plays a large role as well.

To cushion the high lethality of the system, every major character has access to Hero Points, which can be spent in a session to roll 2D10 instead of 1D10 on a check or save. This allows the players to cushion against brutal RNG, but still be wary about being too reckless, as Hero Points are limited, and are used as XP to increase skills. You don't want to throw them all away.

# Level-less, horizontal progression
In CD10, your character does not gain levels as they improve. They accrue experience points based on events in the session and as rewards from the Keeper and other players. These experience points can either be spent (as mentioned above) as Hero Points or to increase skills. In order to improve a skill, the skill must have been used in session, and the character must have failed a check with it, simulating growth and learning from ones mistakes. This makes it hard to improve what you're already good at, encouraging branching out, rather than hyper-specialisation.

The entire system is based around this horizontal progression, where a character becomes more skilled at what they're good at, but also become more generally skilled in a range of abilities and skills, rather than gaining more powerful abilities to replace their old.

# In development
CD10 RPG is currently in development and CD10 Core, the free portion, is considered to be in an alpha state. Things are likely to change as the system develops. It is fully useable for gameplay, but because it is still going through gameplay tests, core mechanics can change. Hence the Alpha status. Otherwise, it would be considered Beta.

# CD10 Core vs CD10 Advanced
CD10 Advanced, which includes several optional, advanced modules, such as bleeding, poison, disease and magic, is also in alpha, but in a less robust state. Some modules are completed, while others are still in the draft stage. 

CD10 Advanced is the paid-for version of the system and is currently only available to supporters (see below).

# Foundry VTT Development Status
The Foundry VTT system of CD10 is based on CD10 Core and until that hits 1.0, no CD10A features will be added.

Character and item sheets are fully implemented with internal mechanics, but no auto-calculations are included yet.

The system does not come with any content packs (such as items, skills, traits etc) at present. Because of the alpha-state of the system outside of Foundry, there's still too much in fluctuation to nail down any content packs.

If you intend to run this system, either wait until it hits 1.0 and the content packs will be developed, or create your own using the provided sheets. Lists and descriptions of skills, traits etc is available in the SRD.

# System SRD
The CD10 Core system reference is available, for free, at Worldanvil (https://www.worldanvil.com/w/CD10). Supporters also get access to the full alpha test of CD10 Advanced, which includes many advanced modules.

If you want to help support the development of this system, both in and outside of Foundry, please visit Ko-Fi (https://ko-fi.com/beyondreality) and buy us a coffee! If you want, you can also support us monthly for something nice in return!

In case you have questions about the system itself, feel free to either contact me (Toblin) on the Foundry Discord, or better yet, join the CD10 Discord Server: https://discord.gg/YGQ2zMW

# Instructions
Before attempting to use this system, you should be familiar with how CD10 runs. The rules are available at the links above.

# Creating Skills and Traits
To create skills, traits and items on a character, simply create items in the game system, then drag and drop them on top of the character's sheet. They automatically show up in the proper sections. Skills, spells and traits are all adjusted by using the input box for skill level. 

# Weapons, armor and equipment
Weapons and armor can be equipped from the inventory tab by clicking the "+" symbol, and unequipped by clicking the "-" symbol. You can also equip and unequip using the right-click context menu.

# Equipment load (optional rule)
Equipment load is automatically calculated and showed on the sheet under "Encumbrance". All characters default to a 12kg encumbrance limit. Future releases will allow species choices, traits etc to affect this value.

# Injuries
Wounds and shock is added by left-clicking on respective bar. Right clicking removes a pip. Debilitation is automatically calculated and displayed.

# Skill checks
Single-click on the roll-icon (a D10 that shows up on Skill mouse-over) will perform a skill check with that skill, taking into account any debilitation, and post the results as a default roll message in chat. (Spells not yet included, coming in future release)

Shift-click on the roll icon performs a hero-point boosted skill check in the same manner, first checking to see there are experience points to spend and deducting one. If there isn't enough experience to make a hero-point check, an error shows instead.

# Complex checks (involving traits)
Click the "Complex Check" button on the sheet to get a dialog where you can configure the roll, selecting skill and trait, as well as if it should be a hero point check and/or reverse the trait.

(In future versions, this dialog will handle all complex checks, including physical saves and attacks involving traits)

# Attacking and defending
To make attack checks, left click (or shift-click for heropoint) on the damage type of your weapon (on the weapon card). An attack is automatically rolled.

To make physical saves, left click on the damage type (of the attack) on your armor card. A dialog opens to allow you to configure your save. Wounds and Shock is automatically handled and added to your character sheet.

# Note to Keepers
CD10 is a Theatre of the Mind game, designed to be played without battle maps. In the future, more support for tokens and combat mechanics will be implemented into Foundry, but at the moment, there is no combat tracker and no targeting mechanic for automatic attack/defense rolls.

Handle each roll separately for now. This is likely to remain so in the future as well, due to the flexibility of CD10, allowing players (and NPCs!) to apply Hero Points to their checks at will.
