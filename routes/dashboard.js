const express = require("express");
const { TotalProducts,TotalProductsSold,TotalProductsLeft,TotalAmountCollected , TotalReturned, TotalAmountInvested ,profit } = require("../controller/dashboard");

const router = express.Router();

router.get("/TotalProducts", TotalProducts);
router.get("/TotalProductsSold", TotalProductsSold);
router.get("/TotalProductsLeft", TotalProductsLeft);
router.get("/TotalAmountCollected", TotalAmountCollected);
router.get("/TotalReturned", TotalReturned);
router.get("/TotalAmountInvested", TotalAmountInvested);
router.get("/profit", profit);

module.exports = router;