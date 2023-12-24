const express = require("express");
const { login, getUserData,addUser,getOneUserData, deleteUser,logout,editUser } = require("../controller/user");

const router = express.Router();

router.post("/login", login);
router.get("/userData", getUserData);
router.get("/getOneUserData/:id", getOneUserData);
router.get("/logout", logout);
router.post("/addUser", addUser);
router.put("/editUser/:id", editUser);
router.delete("/delete", deleteUser);

module.exports = router;