const express = require("express");
const { login, getUserData,addUser, deleteUser } = require("../controller/user");

const router = express.Router();

router.post("/login", login);
router.get("/userData", getUserData);
router.post("/addUser", addUser);
router.delete("/delete", deleteUser);

module.exports = router;