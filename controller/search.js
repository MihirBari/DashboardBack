const { pool } = require("../database");

const search = (req, res) => {
    const searchTerm = req.body.product_id;
    const searchTerm1 = req.body.product_name;
    const searchTerm2 = req.body.Description;
    console.log('Search term:', searchTerm);
    const query = `
      SELECT product_id, product_name, Description
      FROM products
      WHERE product_id = ? OR product_name = ? OR Description REGEXP ?;
    `;
  
    const values = [searchTerm, searchTerm1, searchTerm2];
  
    pool.query(query, values, (error, results) => {
      if (error) {
        console.error('Error executing query:', error);
        // Handle the error
        return res.status(500).json({ error: 'Internal Server Error' });
      }
  
      console.log('Search results:', results);
      res.json(results);
    });
  };
  
  module.exports = { search };