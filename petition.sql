DROP TABLE IF EXISTS petition;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id SERIAL primary key,
    first VARCHAR(100) not null,
    last VARCHAR(100) not null,
    email VARCHAR(100) not null UNIQUE,
    password VARCHAR(100) not null
);

CREATE TABLE petition (
    id SERIAL primary key,
    first VARCHAR(100),
    last VARCHAR(100),
    sig VARCHAR(1000000),
    user_id INTEGER REFERENCES users(id)
);

CREATE TABLE user_profiles (
    id SERIAL primary key,
    age INTEGER,
    city VARCHAR(100),
    url VARCHAR(100),
    user_id INTEGER REFERENCES users(id) NOT NULL UNIQUE
);
