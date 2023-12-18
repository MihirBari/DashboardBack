const express = require("express");
const { login, getUserData,addUser, deleteUser,logout } = require("../controller/user");

const router = express.Router();

router.post("/login", login);
router.get("/userData", getUserData);
router.get("/logout", logout);
router.post("/addUser", addUser);
router.delete("/delete", deleteUser);

module.exports = router;