const express = require("express");
const { inventory, addProduct, deleteProduct, addImage, oneProduct, updateProduct,productId, sendImage } = require("../controller/product");
const { search } = require("../controller/search");

const router = express.Router();


router.get("/inventory", inventory);
router.get(`/Product/:product_id`, oneProduct);
router.post("/addProduct", addProduct);
router.get("/productId", productId);
router.post("/Search", search);
router.delete("/delete", deleteProduct);
router.post('/upload', addImage);
router.put('/updateProduct/:product_id',updateProduct)
router.get(`/sendImage`, sendImage);


module.exports = router;