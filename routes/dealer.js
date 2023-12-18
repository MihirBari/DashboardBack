const express = require("express");
const { showDealer,addDealer, deleteSeller,editDealer } = require("../controller/dealer");

const router = express.Router();

router.get("/showDealer", showDealer);

router.post("/addDealer", addDealer);
router.post("/editDealer/:id", editDealer);

router.delete("/delete", deleteSeller);

module.exports = router;