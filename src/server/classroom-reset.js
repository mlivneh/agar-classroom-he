'use strict';

const db = require('./sql');

/** מוחק טבלאות צ'אט / ניסיונות התחברות (SQLite פתוח). */
function clearClassroomTables(done) {
    db.serialize(() => {
        db.run('DELETE FROM chat_messages', (e1) => {
            if (e1) {
                console.error(e1);
                return done(e1);
            }
            db.run('DELETE FROM failed_login_attempts', (e2) => {
                if (e2) {
                    console.error(e2);
                }
                done(e2 || null);
            });
        });
    });
}

module.exports = { clearClassroomTables };
