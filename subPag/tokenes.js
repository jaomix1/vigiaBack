var express = require('express');
var tokenes = express.Router();
var jwt = require('jsonwebtoken');
var dotenv = require('dotenv');

const sql = require('mssql')


dotenv.config();

const config = {
  user: process.env.USER,
  password: process.env.PASS,
  server: process.env.SERVER_SQL,
  database: process.env.BD,
  "options": {
      "encrypt": true,
      "enableArithAbort": true
  }
}

function generateAccessToken(username) {
  return jwt.sign({ user : username }, process.env.TOKEN_SECRET, { expiresIn: '28800s' }); //28800s = VENCE EN 8 HORAS
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (token == null) return res.sendStatus(401)

  jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403)
    req.user = user
    next()
  })
}


tokenes.post("/v1/User/Login", function (req, res) {
  (async function () {
    try {
        let pool = await sql.connect(config)
        //Stored procedure        
        let result2 = await pool.request()
            .input('Correo', sql.VarChar, req.body.Correo)
            .input('Clave', sql.VarChar, req.body.Clave)
            .output('Id', sql.VarChar)
            .output('Nombre', sql.VarChar)
            .output('PerfilId', sql.VarChar)
            .output('Perfil', sql.VarChar)
            .output('Mail', sql.VarChar)
            .execute('dbo.SP_Login')

        if (result2.output.Id == null)
            res.status(400).send('Login no valido');
        else{          
          //res.status(200).send(result2.output);
          const token = generateAccessToken(result2.output);
          res.json(token);
        }
    } catch (err) {
        res.status(400).send(err + " " + req.body);
    }
})()
});


module.exports = tokenes;