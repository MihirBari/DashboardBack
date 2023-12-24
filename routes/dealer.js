const express = require("express");
const { showDealer,addDealer, deleteSeller,editDealer ,showOneDealer} = require("../controller/dealer");

const router = express.Router();

router.get("/showDealer", showDealer);
router.get("/showOneDealer/:id", showOneDealer);
router.post("/addDealer", addDealer);
router.put("/editDealer/:id", editDealer);

router.delete("/delete", deleteSeller);

module.exports = router;