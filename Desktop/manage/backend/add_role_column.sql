-- Run once in MySQL (database: mng) if the users table has no role column
ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user';
UPDATE users SET role = 'admin' WHERE LOWER(email) = 'muyizerenafsi@gmail.com';
