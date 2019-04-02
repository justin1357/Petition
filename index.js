var express = require("express");
var app = express();
const db = require("./db");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
var cookieSession = require("cookie-session");
const csurf = require("csurf");
const bcrypt = require("./bcrypt");
////////////////
var hb = require("express-handlebars");
app.engine("handlebars", hb());
app.set("view engine", "handlebars");
///////////////
app.use(express.static("./public"));
//////////////
app.use(cookieParser());
app.use(
    cookieSession({
        secret: process.env.Cookie || "secret",
        maxAge: 1000 * 60 * 60 * 24 * 14
    })
);
app.use(
    bodyParser.urlencoded({
        extended: false
    })
);
app.use(csurf());
app.use(function(req, res, next) {
    res.setHeader("X-Frame_Options", "DENY");
    res.locals.csrfToken = req.csrfToken();
    res.locals.loggedin = req.session.user_id;
    next();
});
app.use(function(req, res, next) {
    if (
        !req.session.user_id &&
        req.url != "/petition/register" &&
        req.url != "/petition/login"
    ) {
        res.redirect("/petition/register");
    } else {
        next();
    }
});
function requireLoggedOutUser(req, res, next) {
    if (req.session.user_id) {
        res.redirect("/petition");
    } else {
        next();
    }
}
/////////////
app.get("/petition", (req, res) => {
    if (!req.session.user_id) {
        res.redirect("/petition/register");
    } else if (!req.session.id) {
        res.render("petition", {
            layout: "main"
        });
    } else {
        res.redirect("/petition/thanks");
    }
});
app.get("/petition/thanks", (req, res) => {
    let sigURL = req.session.id;
    db.getSig(sigURL)
        .then(data => {
            res.render("thanks", {
                layout: "main",
                img: data.rows
            });
        })
        .catch(err => {
            console.log("thanks page", err);
            console.log(sigURL);
        });
});
app.get("/petition/signers", (req, res) => {
    db.addNames().then(data => {
        res.render("signers", {
            layout: "main",
            name: data.rows
        });
    });
});
app.get("/petition/register", requireLoggedOutUser, (req, res) => {
    if (!req.session.id) {
        res.render("register", {
            layout: "main"
        });
    } else {
        res.redirect("/petition");
    }
});
app.get("/petition/login", requireLoggedOutUser, (req, res) => {
    if (!req.session.user_id) {
        res.render("login", {
            layout: "main"
        });
    } else {
        res.redirect("/petition");
    }
});
app.get("/petition/profile", (req, res) => {
    res.render("profile", {
        layout: "main"
    });
});
app.get("/petition/signers/:city", (req, res) => {
    db.getCity(req.params.city).then(data => {
        res.render("signers", {
            layout: "main",
            name: data.rows
        });
    });
});
app.get("/petition/edit", (req, res) => {
    db.getProfileData(req.session.user_id)
        .then(data => {
            res.render("edit", {
                layout: "main",
                data: data.rows
            });
        })
        .catch(err => {
            console.log("Profile Data Err", err);
        });
});
app.get("/petition/logout", (req, res) => {
    req.session.user_id = null;
    req.session.id = null;
    res.redirect("/petition/register");
});
/////////////////////////////////////
app.post("/petition", (req, res) => {
    if (req.body.signature == "") {
        res.render("petition", {
            layout: "main",
            error: "error"
        });
    } else {
        db.getName(req.body.signature, req.session.user_id)
            .then(data => {
                req.session.id = data.rows[0].id;
                res.redirect("/petition/thanks");
            })
            .catch(err => {
                console.log("Err is in petition", err);
            });
    }
});
app.post("/petition/register", (req, res) => {
    if (
        req.body.firstname == "" ||
        req.body.lastname == "" ||
        req.body.password == "" ||
        req.body.email == ""
    ) {
        res.render("register", {
            layout: "main",
            error: "error"
        });
    } else {
        bcrypt
            .hashPassword(req.body.password)
            .then(pass => {
                return db
                    .register(
                        req.body.firstname,
                        req.body.lastname,
                        req.body.email,
                        pass
                    )
                    .then(data => {
                        req.session.user_id = data.rows[0].id;
                        res.redirect("/petition/profile");
                    });
            })
            .catch(err => {
                console.log("catch 1", err);
                return res.render("register", {
                    layout: "main",
                    error: "error"
                });
            });
    }
});
app.post("/petition/login", (req, res) => {
    db.getUser(req.body.email)
        .then(data => {
            let user_id = data.rows[0].id;
            bcrypt
                .checkPassword(req.body.password, data.rows[0].password)
                .then(doesMatch => {
                    if (doesMatch) {
                        req.session.user_id = user_id;
                        // return user_id;
                        db.checkSig(user_id)
                            .then(data => {
                                if (data.rowCount == 1) {
                                    req.session.id = data.rows[0].id;
                                    res.redirect("/petition");
                                } else {
                                    res.redirect("/petition");
                                }
                            })
                            .catch(err => {
                                console.log("login sig error", err);
                                return res.render("login", {
                                    layout: "main",
                                    error: "error"
                                });
                            });
                    } else {
                        return res.render("login", {
                            layout: "main",
                            error: "error"
                        });
                    }
                });
        })
        .catch(err => {
            console.log("get pass", err);
            return res.render("login", {
                layout: "main",
                error: "error"
            });
        });
});
app.post("/petition/profile", (req, res) => {
    if (req.body.age == "") {
        req.body.age = null;
    }
    if (
        req.body.homepage.startsWith("http://") ||
        req.body.homepage.startsWith("https://") ||
        req.body.homepage == ""
    ) {
        db.profile(
            req.body.age,
            req.body.city,
            req.body.homepage,
            req.session.user_id
        )
            .then(() => {
                res.redirect("/petition");
            })
            .catch(err => {
                console.log("Err in profile page", err);
                res.render("profile", {
                    layout: "main",
                    error: "error"
                });
            });
    } else {
        res.render("profile", {
            layout: "main",
            error: "error"
        });
    }
});
app.post("/petition/edit", (req, res) => {
    if (req.body.age == "") {
        req.body.age = null;
    }
    if (
        req.body.homepage.startsWith("http://") ||
        req.body.homepage.startsWith("https://") ||
        req.body.homepage == ""
    ) {
        if (req.body.password != "") {
            bcrypt
                .hashPassword(req.body.password)
                .then(pass => {
                    return db
                        .updateProfileWithPassword(
                            req.body.first,
                            req.body.last,
                            req.body.email,
                            pass,
                            req.session.user_id
                        )
                        .then(() => {
                            return db.updateUsers_Profile(
                                req.body.age,
                                req.body.city,
                                req.body.homepage,
                                req.session.user_id
                            );
                        })
                        .then(() => {
                            res.redirect("/petition/");
                        })
                        .catch(err => {
                            console.log("Err in pass update", err);
                            res.render("edit", {
                                layout: "main",
                                error: "error"
                            });
                        });
                })
                .catch(err => {
                    console.log("err with bcrypt in pass update", err);
                    res.render("edit", {
                        layout: "main",
                        error: "error"
                    });
                });
        } else {
            db.updateProfileWithoutPassword(
                req.body.first,
                req.body.last,
                req.body.email,
                req.session.user_id
            )
                .then(() => {
                    return db.updateUsers_Profile(
                        req.body.age,
                        req.body.city,
                        req.body.homepage,
                        req.session.user_id
                    );
                })
                .then(() => {
                    res.redirect("/petition");
                })
                .catch(err => {
                    console.log("err in update without password", err);
                    res.render("edit", {
                        layout: "main",
                        error: "error"
                    });
                });
        }
    } else {
        res.render("edit", {
            layout: "main",
            error: "error"
        });
    }
});
app.post("/petition/thanks", (req, res) => {
    db.deleteSig(req.session.user_id)
        .then(() => {
            req.session.id = null;
            res.redirect("/petition");
        })
        .catch(err => {
            console.log("err in delete function", err);
        });
});
app.post("/logout", (req, res) => {
    req.session.user_id = null;
    req.session.id = null;
    res.redirect("/petition/register");
});
//////////////////////////////////////////
app.listen(process.env.PORT || 8080, () => console.log("listening!"));
