const { pool } = require("../database");

const order = async (req, res) => {
  const {
    creditor_name,
    product_id,
    size,
    returned,
    amount_sold,
    amount_condition,
    paid_by,
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
            creditor_name, product_id, ${sizeColumn}, returned, amount_sold, amount_condition, paid_by,created_at
          ) VALUES (?, ?, ?, ?,?, ?, ?,Now());
          `,
          [
            creditor_name,
            product_id,
            sizeQuantity,
            returned,
            amount_sold,
            amount_condition,
            paid_by
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
  try {
    const {
      creditor_name,
      size,
      returned,
      amount_sold,
      amount_condition,
      paid_by,
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
            returned = ?, amount_sold = ?, amount_condition = ?,paid_by = ?, update_at = NOW()
            WHERE product_id = ?;
            `,
            [
              creditor_name,
              sizeQuantity,
              returned,
              amount_sold,
              amount_condition,
              paid_by,
              product_id,
            ],
            async (insertErr) => {
              if (insertErr) {
                console.error("Error updating order_items:", insertErr);
                connection.rollback();
                connection.release();
                return res.status(500).json({ error: "Error updating order_items" });
              }

              if (returned === 'Yes') {
                try {
                  await connection.query(
                    `
                    UPDATE products
                    SET ${sizeColumn} = ${sizeColumn} + 1, stock = stock + 1
                    WHERE product_id = ?;
                    `,
                    [product_id]
                  );

                  connection.commit((commitErr) => {
                    if (commitErr) {
                      console.error("Error committing transaction:", commitErr);
                      connection.rollback();
                      connection.release();
                      return res.status(500).json({ error: "Error committing transaction" });
                    }
                    connection.release();
                    return res.status(200).json({
                      success: true,
                      message: "Order placed successfully",
                    });
                  });
                } catch (updateErr) {
                  console.error("Error updating product quantities:", updateErr);
                  connection.rollback();
                  connection.release();
                  return res.status(500).json({ error: "Error updating product quantities" });
                }
              } else if (returned === 'No') {
                try {
                  await connection.query(
                    `
                    UPDATE products
                    SET ${sizeColumn} = ${sizeColumn} - 1, stock = stock - 1
                    WHERE product_id = ?;
                    `,
                    [product_id]
                  );

                  connection.commit((commitErr) => {
                    if (commitErr) {
                      console.error("Error committing transaction:", commitErr);
                      connection.rollback();
                      connection.release();
                      return res.status(500).json({ error: "Error committing transaction" });
                    }
                    connection.release();
                    return res.status(200).json({
                      success: true,
                      message: "Order placed successfully",
                    });
                  });
                } catch (updateErr) {
                  console.error("Error updating product quantities:", updateErr);
                  connection.rollback();
                  connection.release();
                  return res.status(500).json({ error: "Error updating product quantities" });
                }
              } else {
                connection.commit((commitErr) => {
                  if (commitErr) {
                    console.error("Error committing transaction:", commitErr);
                    connection.rollback();
                    connection.release();
                    return res.status(500).json({ error: "Error committing transaction" });
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
          console.error("Error processing order:", error);
          connection.rollback();
          connection.release();
          return res.status(500).json({ error: "Error processing order" });
        }
      });
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({ error: "Unexpected error" });
  }
};


const updateOrder = async (req, res) => {
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
      oi.paid_by,
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
      oi.paid_by,
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


