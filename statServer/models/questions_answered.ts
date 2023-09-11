import { RowDataPacket } from "mysql2";
import { db } from "../db";
import { AlbumId } from '../types/album';

export const findAll = (callback: Function) => {
    const queryString = `SELECT count(question_id) FROM user_answer WHERE success=true GROUP BY album_id;`
  
    db.query(queryString, (err, result) => {
      if (err) {callback(err)}
  
      const rows = <RowDataPacket[]> result;
      const albumIds: AlbumId[] = [];
  
      rows.forEach(row => {
        const a_id: AlbumId =  {
            album_id: row.album_id,
        
        }
            albumIds.push(a_id);
      });
      callback(null, albumIds);
    });
  }
