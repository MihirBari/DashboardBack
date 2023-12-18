const { pool } = require("../database");
const multer = require("multer");
const path = require("path");
const sharp = require("sharp");

const poolQuery = (query, values) => {
  return new Promise((resolve, reject) => {
    pool.query(query, values, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};

const upload = multer({
  storage: multer.diskStorage({
    destination: "./Images",
    filename: (req, file, cb) => {
      cb(
        null,
        file.fieldname + "-" + Date.now() + path.extname(file.originalname)
      );
    },
  }),
});

const uploadAsync = async (req, res) => {
  return new Promise((resolve, reject) => {
    upload.single("image")(req, res, (err) => {
      if (err) {
        console.error("Error uploading image:", err);
        reject(err);
      } else {
        // Assuming req.file is populated by multer
        resolve(req.file ? req.file.path : null);
      }
    });
  });
};

const inventory = (req, res) => {
  const inventory = `SELECT product_id, product_name, Description, Stock, s, m, l, xl, xxl, xxxl, xxxxl, xxxxxl, xxxxxxl,Stock, product_price,Cost_price, product_type, created_at, updated_at
                    FROM products`;

  pool.query(inventory, (error, results) => {
    if (error) {
      console.error("Error executing query:", error);
      return;
    }
    res.json(results);
  });
};

const oneProduct = (req, res) => {
  const inventory = `
    SELECT
      product_id,
      product_name,
      Description,
      Stock,
      s, m, l, xl, xxl, xxxl, xxxxl, xxxxxl, xxxxxxl,
      Stock,
      product_price,
      Cost_price,
      product_type,
      product_image
    FROM products
    WHERE product_id = ?;
  `;

  pool.query(inventory, [req.params.product_id], async (error, results) => {
    if (error) {
      console.error("Error executing query:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (results.length === 1) {
      const productDetails = results[0];

      if (productDetails.product_image === null) {
        productDetails.product_image = "path/to/default/image.jpg";
        console.log("Product details:", productDetails);
        return res.status(200).json(productDetails);
      }

      const imageFilePath = productDetails.product_image;

      try {
        // Use sharp to resize and compress the image
        const compressedImageBuffer = await sharp(imageFilePath)
          .resize({ width: 500 }) // Adjust the width as needed
          .toBuffer();

        // Convert the compressed image buffer to base64
        const base64Image = compressedImageBuffer.toString("base64");

        // Add the base64-encoded image to the product details
        productDetails.product_image = base64Image;

        //console.log('Product details:', productDetails);
        res.status(200).json(productDetails);
      } catch (sharpError) {
        console.error("Error compressing image:", sharpError.message);

        // Provide additional information about the error
        if (sharpError.code === "ENOENT") {
          return res.status(404).json({ error: "Image file not found" });
        }

        return res.status(500).json({ error: "Error compressing image" });
      }
    } else {
      return res.status(404).json({ error: "Product not found" });
    }
  });
};

const addImage = async (req, res) => {
  try {
    const imagePath = await uploadAsync(req, res);
    if (imagePath) {
      res
        .status(200)
        .send({ imagePath, message: "Image path stored successfully" });
    } else {
      res.status(400).send("No image uploaded");
    }
  } catch (error) {
    console.error("Error in image upload:", error);
    res.status(500).send("Internal Server Error");
  }
};

const addProduct = async (req, res) => {
  if (!req.body.data || !Array.isArray(req.body.data)) {
    return res.status(400).json({ error: "Invalid data format" });
  }

  try {
    const prod = `
    INSERT INTO products
    (product_id, product_name, Description, s, m, l, xl, xxl, xxxl, xxxxl, xxxxxl, xxxxxxl, stock, product_price, Cost_price, product_type, product_image, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?, NOW()) 
  `;
    for (const product of req.body.data) {
      const totalStock =
        (isNaN(+product.s) ? 0 : +product.s) +
        (isNaN(+product.m) ? 0 : +product.m) +
        (isNaN(+product.l) ? 0 : +product.l) +
        (isNaN(+product.xl) ? 0 : +product.xl) +
        (isNaN(+product.xxl) ? 0 : +product.xxl) +
        (isNaN(+product.xxxl) ? 0 : +product.xxxl) +
        (isNaN(+product.xxxxl) ? 0 : +product.xxxxl) +
        (isNaN(+product.xxxxxl) ? 0 : +product.xxxxxl) +
        (isNaN(+product.xxxxxxl) ? 0 : +product.xxxxxxl);

      const values = [
        product.product_id,
        product.product_name,
        product.Description,
        +product.s,
        +product.m,
        +product.l,
        +product.xl,
        +product.xxl,
        +product.xxxl,
        +product.xxxxl,
        +product.xxxxxl,
        +product.xxxxxxl,
        totalStock,
        product.product_price,
        product.Cost_price,
        product.product_type,
        product.product_image,
      ];

      await pool.query(prod, values);
    }

    res.json({ message: "Products added successfully" });
  } catch (error) {
    console.error("Error adding products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// backend
const updateProduct = async (req, res) => {
  if (!req.body.data || !Array.isArray(req.body.data)) {
    return res.status(400).json({ error: "Invalid data format" });
  }

  
  try {
    const updateQuery = `
      UPDATE products
      SET 
        product_name = ?,
        Description = ?,
        s = ?,
        m = ?,
        l = ?,
        xl = ?,
        xxl = ?,
        xxxl = ?,
        xxxxl = ?,
        xxxxxl = ?,
        xxxxxxl = ?,
        stock = ?,
        product_price = ?,
        Cost_price = ?,
        product_type = ?,
        ${req.body.data.product_image ? 'product_image = ?,' : ''}
        updated_at = NOW()
      WHERE product_id = ?
    `;

    for (const product of req.body.data) {
      const totalStock =
        (isNaN(+product.s) ? 0 : +product.s) +
        (isNaN(+product.m) ? 0 : +product.m) +
        (isNaN(+product.l) ? 0 : +product.l) +
        (isNaN(+product.xl) ? 0 : +product.xl) +
        (isNaN(+product.xxl) ? 0 : +product.xxl) +
        (isNaN(+product.xxxl) ? 0 : +product.xxxl) +
        (isNaN(+product.xxxxl) ? 0 : +product.xxxxl) +
        (isNaN(+product.xxxxxl) ? 0 : +product.xxxxxl) +
        (isNaN(+product.xxxxxxl) ? 0 : +product.xxxxxxl);

      const values = [
        product.product_name,
        product.Description,
        +product.s,
        +product.m,
        +product.l,
        +product.xl,
        +product.xxl,
        +product.xxxl,
        +product.xxxxl,
        +product.xxxxxl,
        +product.xxxxxxl,
        totalStock,
        product.product_price,
        product.Cost_price,
        product.product_type,
        ...(req.body.data.product_image ? [product.product_image] : []),
        req.params.product_id,
      ];
     console.log(values)
      await pool.query(updateQuery, values);
    }

    res.json({ message: "Products updated successfully" });
  } catch (error) {
    console.error("Error updating products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const productId = async (req, res) => {
  try {
    // Use the promisified pool.query function
    const result = await poolQuery("SELECT product_id FROM products");

    // Check if the result is an array and has at least one row
    if (Array.isArray(result) && result.length > 0) {
      const productIds = result.map((row) => row.product_id);
      res.json(productIds);
    } else {
      console.error("No rows found");
      res.status(404).json({ error: "No product IDs found" });
    }
  } catch (error) {
    console.error("Error fetching product_ids:", error.message);
    console.error("Stack trace:", error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteProduct = (req, res) => {
  const query = "DELETE FROM products WHERE product_id = ?";
  const value = [req.body.productId];

  pool.query(query, value, (error, results) => {
    if (error) {
      console.error("Error executing query:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    console.log("Deleted", results);
    res.json(results);
  });
};

const sendImage = async (req, res) => {
  const query = 'SELECT product_id, product_image FROM products';

  pool.query(query, async (err, results) => {
    if (err) {
      console.error('Error executing the SQL query:', err);
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }

    const images = await Promise.all(results.map(async (result) => {
      if (!result.product_image) {
        console.error('Product image is null for Product ID:', result.product_id);
        return null;
      }

      try {
        // Use sharp to resize and compress the image
        const compressedImageBuffer = await sharp(result.product_image)
          .resize({ width: 500 }) // Adjust the width as needed
          .toBuffer();

        // Convert the compressed image buffer to base64
        const base64Image = compressedImageBuffer.toString('base64');

        return {
          product_id: result.product_id,
          image: base64Image,
        };
      } catch (sharpError) {
        console.error('Error processing image with sharp:', sharpError);
        return null;
      }
    }));

    res.json(images.filter(Boolean));
  });
}


module.exports = {
  inventory,
  addProduct,
  deleteProduct,
  addImage,
  oneProduct,
  updateProduct,
  productId,
  sendImage
};
