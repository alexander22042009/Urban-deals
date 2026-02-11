const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();

const DB_PATH = path.join(__dirname, "urbanDeals.sqlite");
const SCHEMA_PATH = path.join(__dirname, "schema.sql");

function openDb() {
    return new sqlite3.Database(DB_PATH);
}

function initDb() {
    const db = openDb();
    const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");

    return new Promise((resolve, reject) => {
        db.exec(schema, (err) => {
            if (err) return reject(err);
            resolve(db);
        });
    });
}

function all(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
    });
}

function get(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
    });
}

function run(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) return reject(err);
            resolve({ changes: this.changes, lastID: this.lastID });
        });
    });
}

module.exports = { initDb, all, get, run };
