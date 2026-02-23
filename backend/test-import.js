import dotenv from "dotenv";
dotenv.config();
console.log("Dotenv loaded");

import("./src/lib/utils.js").then(() => console.log("utils loaded"))
    .catch(err => console.error("utils failed:", err));

import("./src/lib/passport.js").then(() => console.log("passport loaded"))
    .catch(err => console.error("passport failed:", err));

import("./src/controllers/auth.controller.js").then(() => console.log("auth controller loaded"))
    .catch(err => console.error("auth controller failed:", err));

import("./src/routes/auth.route.js").then(() => console.log("auth route loaded"))
    .catch(err => console.error("auth route failed:", err));
