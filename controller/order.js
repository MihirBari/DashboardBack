const { pool } = require("../database");

const order = async (req, res) => {
  const {
    creditor_name,
    product_id,
    size,
    returned,
    amount_sold,
    amount_condition,
  } = req.body;

  console.log("Order received on the server:", req.body);

  pool.getConnection((err, connection) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Error getting database connection" });
    }

    connection.beginTransaction(async (beginErr) => {
      if (beginErr) {
        connection.release();
        return res.status(500).json({ error: "Error starting transaction" });
      }

      try {
        const sizeColumn = size ? size.toLowerCase() : null;
        const sizeQuantity =  1;
        console.log("Order received:", req.body);
        await connection.query(
          `
          INSERT INTO order_items (
            creditor_name, product_id, ${sizeColumn}, returned, amount_sold, amount_condition, created_at
          ) VALUES (?, ?, ?, ?,?, ?, Now());
          `,
          [
            creditor_name,
            product_id,
            sizeQuantity,
            returned,
            amount_sold,
            amount_condition,
          ],
          (insertErr) => {
            if (insertErr) {
              console.error("Error inserting order_items:", insertErr);
              return connection.rollback(() => {
                connection.release();
                res.status(500).json({ error: "Error inserting order_items" });
              });
            }

            const sizeColumn = size ? size.toLowerCase() : null;

            connection.query(
              `
                 UPDATE products
                    SET ${sizeColumn} = ${sizeColumn} - 1,
                    stock = stock - 1
                    WHERE product_id = ?;
               `,
              [ product_id],
              (updateErr) => {
                if (updateErr) {
                  return connection.rollback(() => {
                    connection.release();
                    return res
                      .status(500)
                      .json({ error: "Error updating product quantities" });
                  });
                }

                connection.commit((commitErr) => {
                  if (commitErr) {
                    return connection.rollback(() => {
                      connection.release();
                      return res
                        .status(500)
                        .json({ error: "Error committing transaction" });
                    });
                  }

                  connection.release();
                  res.status(200).json({
                    success: true,
                    message: "Order placed successfully",
                  });
                });
              }
            );
          }
        );
      } catch (error) {
        console.error("Error processing order:", error);
        connection.rollback(() => {
          connection.release();
          res.status(500).json({ error: "Error processing order" });
        });
      }
    });
  });
};

const updateOrder1 = async (req, res) => {
  const {
    creditor_name,
    size,
    returned,
    amount_sold,
    amount_condition,
  } = req.body;

  const { product_id } = req.params;

  pool.getConnection((err, connection) => {
    if (err) {
      return res.status(500).json({ error: "Error getting database connection" });
    }

    connection.beginTransaction(async (beginErr) => {
      if (beginErr) {
        connection.release();
        return res.status(500).json({ error: "Error starting transaction" });
      }

      try {
        const sizeColumn = size ? size.toLowerCase() : null;
        const sizeQuantity = 1;

        await connection.query(
          `
          UPDATE order_items 
          SET creditor_name = ?, ${sizeColumn} = ?,
          returned = ?, amount_sold = ?, amount_condition = ?, update_at = NOW()
          WHERE product_id = ?;
          `,
          [
            creditor_name,
            sizeQuantity,
            returned,
            amount_sold,
            amount_condition,
            product_id,
          ],
          async (insertErr) => {
            if (insertErr) {
              connection.rollback(() => {
                connection.release();
                return res.status(500).json({ error: "Error updating order_items" });
              });
            }

            if (returned === 'Yes') {
              connection.query(
                `
                UPDATE products
                SET ${sizeColumn} = ${sizeColumn} + 1, stock = stock + 1
                WHERE product_id = ?;
                `,
                [ product_id],
                (updateErr) => {
                  if (updateErr) {
                    connection.rollback(() => {
                      connection.release();
                      return res.status(500).json({ error: "Error updating product quantities" });
                    });
                  }

                  connection.commit((commitErr) => {
                    if (commitErr) {
                      connection.rollback(() => {
                        connection.release();
                        return res.status(500).json({ error: "Error committing transaction" });
                      });
                    }

                    connection.release();
                    return res.status(200).json({
                      success: true,
                      message: "Order placed successfully",
                    });
                  });
                }
              );
            } else {
              connection.commit((commitErr) => {
                if (commitErr) {
                  connection.rollback(() => {
                    connection.release();
                    return res.status(500).json({ error: "Error committing transaction" });
                  });
                }

                connection.release();
                return res.status(200).json({
                  success: true,
                  message: "Order placed successfully",
                });
              });
            }
          }
        );
      } catch (error) {
        connection.rollback(() => {
          connection.release();
          return res.status(500).json({ error: "Error processing order" });
        });
      }
    });
  });
};


const updateOrder = async (req, res) =>{
  const {
    creditor_name,
    size,
    sizeValue,
    returned,
    amount_sold,
    amount_condition,
  } = req.body;

  const { product_id } = req.params;

  pool.getConnection((err, connection) => {
    if (err) {
      return res.status(500).json({ error: "Error getting database connection" });
    }

    connection.beginTransaction(async (beginErr) => {
      if (beginErr) {
        connection.release();
        return res.status(500).json({ error: "Error starting transaction" });
      }

      try {
        const sizeColumn = size ? size.toLowerCase() : null;
        const sizeQuantity = isNaN(+sizeValue) ? 0 : +sizeValue;

        await connection.query(
          `
          UPDATE order_items 
          SET creditor_name = ?, ${sizeColumn} = ?, Total_items = ?,
          returned = ?, amount_sold = ?, amount_condition = ?, update_at = NOW()
          WHERE product_id = ?;
          `,
          [
            creditor_name,
            sizeQuantity,
            sizeQuantity,
            returned,
            amount_sold,
            amount_condition,
            product_id,
          ],
          async (insertErr) => {
            if (insertErr) {
              connection.rollback(() => {
                connection.release();
                return res.status(500).json({ error: "Error updating order_items" });
              });
            }

            if (returned === 'Yes') {
              connection.query(
                `
                UPDATE products
                SET ${sizeColumn} = ${sizeColumn} + ?, stock = stock + ?
                WHERE product_id = ?;
                `,
                [sizeQuantity, sizeQuantity, product_id],
                (updateErr) => {
                  if (updateErr) {
                    connection.rollback(() => {
                      connection.release();
                      return res.status(500).json({ error: "Error updating product quantities" });
                    });
                  }

                  connection.commit((commitErr) => {
                    if (commitErr) {
                      connection.rollback(() => {
                        connection.release();
                        return res.status(500).json({ error: "Error committing transaction" });
                      });
                    }

                    connection.release();
                    return res.status(200).json({
                      success: true,
                      message: "Order placed successfully",
                    });
                  });
                }
              );
            } else {
              connection.commit((commitErr) => {
                if (commitErr) {
                  connection.rollback(() => {
                    connection.release();
                    return res.status(500).json({ error: "Error committing transaction" });
                  });
                }

                connection.release();
                return res.status(200).json({
                  success: true,
                  message: "Order placed successfully",
                });
              });
            }
          }
        );
      } catch (error) {
        connection.rollback(() => {
          connection.release();
          return res.status(500).json({ error: "Error processing order" });
        });
      }
    });
  });
};


const filterNullValues = (obj) => {
  const filteredObj = {};
  for (const key in obj) {
    if (obj[key] !== null) {
      filteredObj[key] = obj[key];
    }
  }
  return filteredObj;
};

const viewOrder = async (req, res) => {
  const inventoryQuery = `
    SELECT
      oi.order_id,
      oi.creditor_name,
      oi.product_id,
      p.product_name,
      oi.s,
      oi.m,
      oi.l,
      oi.xl,
      oi.xxl,
      oi.xxxl,
      oi.xxxxl,
      oi.xxxxxl,
      oi.returned,
      oi.amount_sold,
      oi.amount_condition,
      oi.created_at,
      oi.update_at
    FROM
      order_items oi
    JOIN
      products p ON p.product_id = oi.product_id;
  `;

  pool.query(inventoryQuery, (error, results) => {
    if (error) {
      console.error("Error executing query:", error);
      return res.status(500).json({ error: "Error executing query" });
    }

    const filteredResults = results.map((result) => filterNullValues(result));

    res.json(filteredResults);
  });
};

const viewOneOrder = async (req, res) => {
  const inventoryQuery = `
    SELECT
      oi.creditor_name,
      p.product_name,
      oi.s,
      oi.m,
      oi.l,
      oi.xl,
      oi.xxl,
      oi.xxxl,
      oi.xxxxl,
      oi.xxxxxl,
      oi.returned,
      oi.amount_sold,
      oi.amount_condition,
      oi.created_at,
      oi.update_at
    FROM
      order_items oi
    JOIN
      products p ON p.product_id = oi.product_id
    WHERE
      oi.product_id = ?;
  `;

  pool.query(inventoryQuery, [req.params.product_id], (error, results) => {
    if (error) {
      console.error("Error executing query:", error);
      return res.status(500).json({ error: "Error executing query" });
    }

    const filteredResults = results.map((result) => filterNullValues(result));

    res.json(filteredResults);
  });
};

const deleteOrder = (req, res) => {
  const { order_id, product_id, size } = req.body;

  if (!product_id || size === undefined) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const deleteQuery = "DELETE FROM order_items WHERE order_id = ?";
  const deleteValues = [order_id];

  const updateQuery = `
    UPDATE products
    SET 
      ${size} = ${size} + 1,
      stock = stock + 1
    WHERE product_id = ?
  `;

  const updateValues = [product_id];

  pool.getConnection((error, connection) => {
    if (error) {
      console.error("Error getting database connection:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    connection.beginTransaction((beginErr) => {
      if (beginErr) {
        console.error("Error beginning transaction:", beginErr);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      connection.query(deleteQuery, deleteValues, (deleteError, deleteResults) => {
        if (deleteError) {
          return connection.rollback(() => {
            console.error("Error deleting order:", deleteError);
            res.status(500).json({ error: "Internal Server Error" });
          });
        }

        connection.query(updateQuery, updateValues, (updateError, updateResults) => {
          if (updateError) {
            return connection.rollback(() => {
              console.error("Error updating products:", updateError);
              res.status(500).json({ error: "Internal Server Error" });
            });
          }

          connection.commit((commitError) => {
            if (commitError) {
              return connection.rollback(() => {
                console.error("Error committing transaction:", commitError);
                res.status(500).json({ error: "Internal Server Error" });
              });
            }

            console.log("Order deleted and products updated successfully");
            res.json({
              success: true,
              message: "Order deleted and products updated successfully",
              order_id: order_id,
            });

            connection.release();
          });
        });
      });
    });
  });
};



module.exports = { order, updateOrder,updateOrder1, viewOrder, deleteOrder,viewOneOrder };


