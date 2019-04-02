var spicedPg = require("spiced-pg");

var db = spicedPg(
    process.env.DATABASE_URL ||
        "postgres:postgres:postgres@localhost:5432/petition"
);

module.exports.getName = function getName(sig, user_id) {
    return db.query(
        "INSERT INTO petition(sig, user_id) VALUES ($1, $2) RETURNING id",
        [sig, user_id]
    );
};

module.exports.addNames = function addNames() {
    return db.query(`SELECT users.first, users.last, user_profiles.age AS age,
        user_profiles.city AS city, user_profiles.url AS page
    FROM users
    LEFT JOIN user_profiles
    ON users.id = user_profiles.user_id`);
};

module.exports.getSig = function getSig(sigURL) {
    return db.query(`SELECT sig FROM petition WHERE id = $1`, [sigURL]);
};

module.exports.register = function register(
    firstname,
    lastname,
    email,
    password
) {
    return db.query(
        "INSERT INTO users(first, last, email, password) VALUES ($1, $2, $3, $4) RETURNING id",
        [firstname, lastname, email, password]
    );
};

module.exports.getUser = function getUser(email) {
    return db.query(`SELECT password, id FROM users WHERE email = $1`, [email]);
};

module.exports.checkSig = function checkSig(id) {
    return db.query("SELECT id FROM petition WHERE user_id = $1", [id]);
};

module.exports.profile = function profile(age, city, url, id) {
    return db.query(
        "INSERT INTO user_profiles(age, city, url, user_id) VALUES ($1, $2, $3, $4)",
        [age, city, url, id]
    );
};

module.exports.getCity = function getCity(city) {
    return db.query(
        `SELECT users.first, users.last, user_profiles.age AS age,
        user_profiles.city AS city, user_profiles.url AS page
    FROM users
    LEFT JOIN user_profiles
    ON users.id = user_profiles.user_id
    WHERE LOWER(city) = LOWER($1)`,
        [city]
    );
};

module.exports.getProfileData = function getProfileData(id) {
    return db.query(
        `SELECT users.first, users.last, users.email, user_profiles.age,
        user_profiles.city, user_profiles.url
        FROM users
        LEFT JOIN user_profiles
        ON users.id = user_profiles.user_id
        WHERE users.id = $1`,
        [id]
    );
};

module.exports.updateProfileWithPassword = function updateProfileWithPassword(
    first,
    last,
    email,
    password,
    id
) {
    return db.query(
        `UPDATE users
    SET first = $1, last = $2, email= $3 , password = $4
    WHERE id = $5`,
        [first, last, email, password, id]
    );
};

module.exports.updateProfileWithoutPassword = function updateProfileWithoutPassword(
    first,
    last,
    email,
    id
) {
    return db.query(
        `UPDATE users
    SET first = $1, last = $2, email= $3
    WHERE id = $4`,
        [first, last, email, id]
    );
};

module.exports.updateUsers_Profile = function updateUsers_Profile(
    age,
    city,
    homepage,
    id
) {
    return db.query(
        `INSERT INTO user_profiles(age, city, url, user_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id)
        DO UPDATE SET age = $1, city = $2, url = $3, user_id = $4`,
        [age, city, homepage, id]
    );
};

module.exports.deleteSig = function deleteSig(id) {
    return db.query(
        `DELETE FROM Petition
        WHERE user_id = $1`,
        [id]
    );
};
