import { AlbumId } from '../types/album';
import {db} from "../db";
import { OkPacket, RowDataPacket } from "mysql2";

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