const express = require("express");
const { order, updateOrder,updateOrder1,viewOneOrder, viewOrder,deleteOrder } = require("../controller/order");

const router = express.Router();

router.get(`/viewOrder`, viewOrder);
router.get(`/viewOneOrder/:product_id`, viewOneOrder);
router.post("/order", order);
router.put(`/updateOrder/:product_id`, updateOrder1);
router.delete("/delete", deleteOrder);


module.exports = router;