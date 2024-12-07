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
    playerId: number
    playerName: string
    isGroup: boolean
    size : number
}

class PlayerDAO extends EntityDAO<PlayerRow> {
}

router.get('/players',[
    check('playerId', 'playerId is numeric').optional().isNumeric(),
    check('playerName', 'playerId is alphanumeric').optional().isAlphanumeric(),
    validateInput
  ], async (req: Request, res: Response) => {
    const playerId = req.query.playerId as string
    const playerName = req.query.playerName as string
    const dao = new PlayerDAO(mysqlDriver.fetch, mysqlDriver.insert, 'player')
    try {
      const players = await dao.get({
        filter:{playerId,playerName}
      })
      res.status(200).json({ data: players })
    } catch (error) {
      console.log(error)
      return res.status(500).json({ errorMessage: error })
    }
  })

router.put('/players', [
    check('playerName', 'playerName is required').isAlphanumeric(),
    check('isGroup', 'isGroup must be boolean').optional().isBoolean(),
    validateInput
    ], async (req: Request, res: Response) => {
    const dao = new PlayerDAO(mysqlDriver.fetch, mysqlDriver.insert, 'player')
    const value: PlayerRow = {
        ...req.body
    };
    try {
        await dao.post(value, false)
        let result = await dao.get({filter:{playerName:value.playerName}})
        res.status(200).json(result[0])
    } catch (error) {
        console.log(error)
        if(error.code == 'ER_DUP_ENTRY'){
            return res.status(409).json({ errorMessage: error })
        }
        return res.status(500).json({ errorMessage: error })
    }
})

module.exports = router