"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findAll = void 0;
const db_1 = require("../db");
const findAll = (callback) => {
    const queryString = `
      SELECT album_id FROM album`;
    db_1.db.query(queryString, (err, result) => {
        if (err) {
            callback(err);
        }
        const rows = result;
        const albumIds = [];
        rows.forEach(row => {
            const a_id = {
                album_id: row.album_id,
            };
            albumIds.push(a_id);
        });
        callback(null, albumIds);
    });
};
exports.findAll = findAll;
