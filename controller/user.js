const { pool } = require("../database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const saltRounds = 10; 

const login = (req, res) => {
  // Create the SQL query
  const sql = 'SELECT id, name, email, password FROM users WHERE email = ?';
  
  pool.query(sql, [req.body.email], (err, data) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (data.length > 0) {
      bcrypt.compare(req.body.password.toString(), data[0].password, (err, response) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (response) {
          const name = data[0].name;
          const expiresIn = req.body.rememberMe ? '30d' : '5d';

          // Sign the token
          const token = jwt.sign({ name }, 'jwt-secret-key', {
            expiresIn,
          });

          // Set the cookie
          res.cookie('token', token, {
            httpOnly: true,
            maxAge: req.body.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 5 * 24 * 60 * 60 * 1000,
            sameSite: 'Lax',
          });

          return res.status(200).json({
            status: 'Success',
            data: data[0].id,
          });
        } else {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
      });
    } else {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
  });
};


const getUserData = (req,res) => {
    const getAllUsersQuery = 'SELECT id,name, email, created_at, updated_at FROM users';

    pool.query(getAllUsersQuery, (error, results) => {
      if (error) {
        console.error('Error executing query:', error);
        return;
      }
      
      console.log('All users:', results);
      res.status(200).json(results)
    });
}

const getOneUserData = (req, res) => {
  const getOneUserQuery = 'SELECT id, name, email, password FROM users WHERE id = ?';

  pool.query(getOneUserQuery, [req.params.id], (error, results) => {
    if (error) {
      console.error('Error executing query:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('User data:', results[0]);
    res.status(200).json(results);
  });
};


const addUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const userQuery = `
      INSERT INTO users
      (name, email, password, created_at)
      VALUES (?, ?, ?, NOW()) 
    `;

    const values = [name, email, hashedPassword];

    pool.query(userQuery, values, (error, results) => {
      if (error) {
        console.error('Error executing query:', error);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }

      console.log('Added User:', results);
      res.status(201).json({ message: 'User added successfully!' });
    });
  } catch (hashError) {
    console.error('Error hashing password:', hashError);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const editUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    let hashedPassword = null;

    // Check if a new password is provided
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const userQuery = `
      UPDATE users
      SET name = ?, email = ?, ${hashedPassword ? 'password = ?,' : ''} updated_at = NOW()
      WHERE id = ?
    `;

    const values = [name, email, ...(hashedPassword ? [hashedPassword] : []), req.params.id];

    pool.query(userQuery, values, (error, results) => {
      if (error) {
        console.error('Error executing query:', error);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }

      console.log('Updated User:', results);
      res.status(200).json({ message: 'User updated successfully!' });
    });
  } catch (hashError) {
    console.error('Error hashing password:', hashError);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


const deleteUser = (req,res) => {
  const query = `DELETE from  users where id =?`
   
  const value = [req.body.id]
 
  pool.query(query,value, (error, results) => {
    if (error) {
      console.error('Error executing query:', error);
      return;
    }
  
    console.log('Deleted', results);
    res.json(results)
  });
}

const logout = (req, res) => {
  res.cookie("token");
  return res.json({
    status: "Success",
  });
}

module.exports = { login,getUserData,getOneUserData,addUser,deleteUser,logout,editUser };