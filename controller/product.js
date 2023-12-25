const { pool } = require("../database");
const multer = require("multer");
const path = require("path");
const Jimp = require('jimp');
const { query } = require("express");

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
}).array("images", 10);

const uploadAsync = async (req, res) => {
  return new Promise((resolve, reject) => {
    upload(req, res, async (err) => {
      if (err) {
        console.error("Error uploading images:", err);
        reject(err);
      } else {
        try {
          const imagePaths = req.files.map((file) => file.path);
          resolve(imagePaths);
        } catch (error) {
          console.error("Error processing images:", error);
          reject(error);
        }
      }
    });
  });
};

const inventory = (req, res) => {
  const inventory = `
  SELECT
    p.product_id,
    p.product_name,
    p.Description,
    p.Stock,
    p.s,
    p.m,
    p.l,
    p.xl,
    p.xxl,
    p.xxxl,
    p.xxxxl,
    p.xxxxxl,
    p.xxxxxxl,
    p.Stock,
    p.product_price,
    p.Cost_price,
    p.product_type,
    p.other_cost,
    p.Final_cost,
    p.created_at,
    p.updated_at,
    u.name as Created_by,
    uu.name as Updated_by
  FROM
    products p
  JOIN
    Users u ON u.id = p.user_id
  LEFT JOIN
    Users uu ON uu.id = p.uuser_id
`;

pool.query(inventory, (error, results) => {
  if (error) {
    console.error("Error executing query:", error);
    return res.status(500).json({ error: "Internal Server Error" });
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
      product_image,
      other_cost,
      Final_cost
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

      // Parse the product_image back to an array
      if (productDetails.product_image) {
        try {
          productDetails.product_image = JSON.parse(productDetails.product_image);
        } catch (jsonParseError) {
          console.error("Error parsing product_image:", jsonParseError.message);
          return res.status(500).json({ error: "Error parsing product_image" });
        }
      } else {
        // Set a default image path if product_image is null
        productDetails.product_image = ["path/to/default/image.jpg"];
      }

      // Handle each image in the array
      try {
        const images = await Promise.all(productDetails.product_image.map(async (imagePath) => {
          const imageFilePath = imagePath; // Adjust the path as needed
          const image = await Jimp.read(imageFilePath);
          await image.resize(500, Jimp.AUTO).quality(80);
          return image.getBase64Async(Jimp.MIME_JPEG);
        }));

        productDetails.product_image = images;

        res.status(200).json(productDetails);
      } catch (jimpError) {
        console.error("Error compressing image:", jimpError.message);

        if (jimpError.code === "ENOENT") {
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
    const imagePaths = await uploadAsync(req, res);
    if (imagePaths.length > 0) {
      res.status(200).send({
        imagePaths,
        message: "Images paths stored successfully",
      });
    } else {
      res.status(400).send("No images uploaded");
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

  const userId = req.body.data[0].userId;
  console.log(userId);

  try {
    const prod = `
    INSERT INTO products
  (product_id, product_name, Description, s, m, l, xl, xxl, xxxl, xxxxl, xxxxxl, xxxxxxl, stock,
  product_price, Cost_price, product_type, product_image, other_cost, Final_cost, user_id, created_at)
VALUES( 
  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW()
)
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
        JSON.stringify(product.product_image),
        product.other_cost,
        product.Final_cost,
        userId
      ];

      console.log("values: ", values);

      await pool.query(prod, values);

    }

    res.json({ message: "Products added successfully" });
  } catch (error) {
    console.error("Error adding products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const updateProduct = async (req, res) => {
  if (!req.body.data || !Array.isArray(req.body.data)) {
    return res.status(400).json({ error: "Invalid data format" });
  }

  const userId = req.body.userId;

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
        other_cost = ?,
        Final_cost = ?, 
        user_id = ?,
        product_type = ?,
        ${req.body.data[0].product_image ? 'product_image = ?,' : ''}
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
        product.other_cost,
        product.Final_cost,
        userId,
        product.product_type,
        ...(product.product_image ? [JSON.stringify(product.product_image)] : []),
        req.params.product_id,
      ];

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
        // Parse the product_image back to an array
        const imagePaths = JSON.parse(result.product_image);

        // Take only the first image path
        const firstImagePath = imagePaths[0];

        // Use Jimp to resize and compress the image
        const image = await Jimp.read(firstImagePath);
        await image.resize(500, Jimp.AUTO).quality(80);
        const compressedImageBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);

        // Convert the compressed image buffer to base64
        const base64Image = compressedImageBuffer.toString('base64');

        return {
          product_id: result.product_id,
          image: base64Image,
        };
      } catch (jimpError) {
        console.error('Error processing image with Jimp:', jimpError);
        return null;
      }
    }));

    res.json(images.filter(Boolean));
  });
};


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
