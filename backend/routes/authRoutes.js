const express = require("express");
const router = express.Router();
const { login } = require("../controllers/authController");

// Cuando Angular haga un POST a /api/auth/login, se ejecutará nuestra función
router.post("/login", login);

module.exports = router;
