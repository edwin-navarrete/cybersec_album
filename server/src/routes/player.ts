import { Router, Request, Response, NextFunction } from 'express'
import { check, validationResult } from 'express-validator'

import EntityDAO from '../controllers/entityDao'
import mysqlDriver from '../controllers/mysqlDriver'
import validateInput from './validateInput'

const router = Router()
/*
CREATE table player (
	player_id MEDIUMINT UNSIGNED NOT NULL auto_increment,
    player_name VARCHAR(80) NOT NULL,
    is_group BOOLEAN DEFAULT 0,
    size SMALLINT UNSIGNED DEFAULT 1,
    group_id MEDIUMINT UNSIGNED,
    primary key (player_id),
    UNIQUE KEY (player_name, is_group)
);
*/

interface PlayerRow {
    playerId?: number
    playerName: string
    isGroup: boolean
    isLeader?: boolean
    groupId?: number
    groupName?: string
    groupSize?: number
}

class PlayerDAO extends EntityDAO<PlayerRow> {
}

router.get('/player',[
    check('groupId', 'groupId is numeric').optional().isNumeric(),
    check('playerId', 'playerId is numeric').optional().isNumeric(),
    check('playerName', 'playerId is alphanumeric').optional().isAlphanumeric(),
    validateInput
  ], async (req: Request, res: Response) => {
    const groupId = req.query.groupId as string
    const playerId = req.query.playerId as string
    const playerName = req.query.playerName as string
    const dao = new PlayerDAO(mysqlDriver.fetch, mysqlDriver.insert, 'player')
    try {
      const players = await dao.get({
        filter:{groupId,playerId,playerName}
      })
      res.status(200).json({ results: players })
    } catch (error) {
      console.log(error)
      return res.status(500).json({ errorMessage: error })
    }
  })

router.post('/player', [
    check('mode', "mode must be 'coop' or 'solo'").default('solo').optional().matches('(coop|solo)'),
    check('lang', "lang must be 'es' or 'en'").default('es').optional().matches('(en|es)'),
    check('playerId', 'playerId must be numeric').optional({ nullable: true }).isNumeric(),
    check('playerName', 'playerName is required and is chars and spaces').isAlpha('es-ES', { ignore: ' ' }),
    validateInput
    ], async (req: Request, res: Response) => {
    const dao = new PlayerDAO(mysqlDriver.fetch, mysqlDriver.insert, 'player')
    const {playerId, playerName} = req.body
    const mode = req.body.mode
    const newPlayer: PlayerRow = { playerId, playerName, isGroup: false };
    try {
        const postResult = await ( newPlayer.playerId?  dao.update(newPlayer) :  dao.post(newPlayer, false))
        if( !newPlayer.playerId && req.body.mode == 'coop'){
            newPlayer.playerId = postResult.insertId
            // only when creating a new player it can be assigned to a group
            const assignedGrp = await assignGroup( req.body.lang )
            if(!assignedGrp){
                return res.status(500).json({ errorMessage: "Unable to assign a group" })
            }
            newPlayer.groupId = assignedGrp.playerId
            if(!assignedGrp.groupSize){
                // First player become leader
                newPlayer.isLeader = true
            }
            await dao.update(newPlayer)
            newPlayer.groupName = assignedGrp.playerName
        }
        else {
            const players = await dao.get({
                filter:{playerId}
              })
            if(players){
                newPlayer.isLeader = players[0].isLeader;
            }
        }
        newPlayer.playerId = newPlayer.playerId || postResult.insertId
        res.status(200).json( newPlayer )
    } catch (error) {
        console.log(error)
        if(error.code == 'ER_DUP_ENTRY'){
            return res.status(409).json({ errorMessage: error })
        }
        return res.status(500).json({ errorMessage: error })
    }
})

async function assignGroup( lang: string){
    // Get the oldest group_id
    const GROUP_LIMIT = 20
    const dao = new PlayerDAO(mysqlDriver.fetch, mysqlDriver.insert, 'player')
    const grpQry = "SELECT DISTINCT p.player_id group_id, p.player_name group_name, p.modified_on, COUNT(DISTINCT t.player_id) group_size " +
                "FROM player p " +
                "LEFT JOIN album a ON a.player_id = p.player_id AND ended_on IS NOT NULL " +
                "LEFT JOIN player t ON t.group_id = p.player_id AND t.is_group = 0 " +
                "WHERE p.is_group = 1 " +
                "AND a.player_id IS NULL " +
                "GROUP BY p.player_name " +
                "HAVING COUNT(DISTINCT t.player_id) < " + GROUP_LIMIT +
                " ORDER BY p.modified_on ASC " +
                "LIMIT 2";

    while(true){
        const groups = await mysqlDriver.fetch(grpQry)
        // Make sure there are at least 2 groups available
        if(groups.length < 2){
            for( let i = 0; i < groups.length; i++){
                const group_name = await generateUniqGroupName(lang)
                if(!group_name){
                    return null
                }
                const newGroup: PlayerRow = { playerName: group_name, isGroup: true };
                await dao.post(newGroup)
            }
            continue
        }
        const { group_id, group_name, group_size} = groups[0]
        const foundGroup: PlayerRow = {playerId: group_id, playerName: group_name, isGroup:true, groupSize: group_size};
        // Update modified_on
        await mysqlDriver.insert('UPDATE player SET modified_on = CURRENT_TIMESTAMP WHERE player_id=?', [group_id])
        return foundGroup
    }
}

async function generateUniqGroupName( lang: string): Promise<string>{
    const dao = new PlayerDAO(mysqlDriver.fetch, mysqlDriver.insert, 'player')
    const uniqNames = []
    const allNames = generate_all_group_names(lang);
    const batch = 20
    for (const name of allNames) {
        uniqNames.push(name)
        if(uniqNames.length >= batch){
            const found = await searchUnkPlayerName(dao, uniqNames)
            if (found) return found;
            uniqNames.length = 0
        }
    }
    if(uniqNames.length){
        const found = await searchUnkPlayerName(dao, uniqNames)
        if (found) return found;
    }
    console.error('Ran out of group names!')
    return null
}

async function searchUnkPlayerName(dao : PlayerDAO, uniqNames:string[]): Promise<string>{
    const found = await dao.get({
        filter:{ playerName: uniqNames }
    })
    if (found.length < uniqNames.length){
        if (!found){
            return uniqNames[0]
        }
        else {
            const foundNames = new Set(found.map(p=>p.playerName));
            return uniqNames.find( n => !foundNames.has(n))
        }
    }
    return null
}

function* generate_all_group_names(lang: string): Generator<string> {
    let tribes_arr = {
        en: ["Amazons", "Barbarians", "Dwarves", "Elves", "Fauns", "Ghouls", "Giants", "Goblins", "Gypsies", "Halflings",
            "Homunculi", "Igors", "Kobolts", "Lepracahuns", "Orcs", "Pixies", "Priestesses", "Pygmies", "Trolls", "Sorcerers", "Tritons", "Skelletons"
        ],
        es: ["Amazonas", "Barbaros", "Enanos", "Elfos", "Faunos", "Espectros", "Gigantes", "Gnomos", "Gitanos", "Wayú", "Templarios",
            "Piegrandes", "Marimondas", "Mayas", "Orcos", "Duendes", "Sacerdotes", "Pigmeos", "Forrajidos", "Hechizeros", "Tritones", "Esqueletos"
        ]
    }
    let variants_arr = {
        en:["Aquatic", "Alchemist", "Master", "Forrest", "Flying", "Heroic", "Imperial", "Underworld", "Wealthy", "Mercenary",
            "Diplomat", "Comando", "Spirit", "Merchant", "Mounted", "Copycat", "Berserk", "Lava", "Desert", "Sea", "Hill", "Evil", "City"
        ],
        es:["Acuáticos", "Alquimistas", "Sabios", "del Bosque", "Voladores", "Heróicos", "Imperiales", "Subterráneos", "Ricos", "Mercenarios",
            "Diplomáticos", "Comando", "Espirituales", "Mercaderes", "Intrépidos", "Imitadores", "Furiosos", "de Lava", "del Desierto", "del Mar", "de la colina", "Malévolos", "Citadinos"
        ]
    }
   
    const tribes = shuffleArray(tribes_arr[lang]);
    const variants =shuffleArray(variants_arr[lang]);
    for (const tribe of tribes) {
        for (const variant of variants) {
            yield lang === 'es' ? `Los ${tribe} ${variant}` : `The ${variant} ${tribe}`;
        }
    }
}

function shuffleArray(array: Array<any>): Array<any> {
    for (let i = array.length - 1; i >= 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array
}
module.exports = router