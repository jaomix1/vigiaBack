const express = require('express');
const tokenes = express.Router();
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

const sql = require('mssql');
const { NULL } = require('xlsx-populate/lib/FormulaError');


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
  return jwt.sign({ user: username }, process.env.TOKEN_SECRET, { expiresIn: '28800s' }); //28800s = VENCE EN 8 HORAS
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
        .input('Usuario', sql.VarChar, req.body.Usuario)
        .input('App', sql.VarChar, "SOL")
        .output('Clave', sql.VarChar)
        .output('Id', sql.VarChar)
        .output('Nombre', sql.VarChar)
        .output('PerfilId', sql.VarChar)
        .output('Perfil', sql.VarChar)
        .output('Mail', sql.VarChar)
        .execute('PQR.dbo.SP_LoginCifrado')

      if (result2.output.Id == null)
        res.status(400).send('Login no valido');
      else {

        const user = result2.output;

        if (bcrypt.compareSync(req.body.Clave, user.Clave)) {
          user.Clave = 'NULL';
          const token = generateAccessToken(user);
          res.json(token);
        } else {
          res.status(401).json({ message: 'Usuario o contraseña incorrecta' });
        }


      }
    } catch (err) {
      res.status(400).send(err + " " + req.body);
    }
  })()
});



tokenes.get("/v1/Usuario/Index", authenticateToken, (_req, res) => {
  (async function () {
    try {
      let pool = await sql.connect(config)
      //Stored procedure        
      let result2 = await pool.request()
        .input('App', sql.VarChar, "SOL")
        .execute('PQR.[dbo].[SP_Usuarios]')
      res.status(200).send(result2.recordsets[0]);
    } catch (err) {
      res.status(400).send(err + " " + _req.body);
    }
  })()
});

tokenes.get("/v1/Usuario/Index/:Guid", authenticateToken, (_req, res) => {
  let Guid = _req.params.Guid;

  if (Guid == '') {
    Guid = 0;
  }

  (async function () {
    try {
      let pool = await sql.connect(config)
      //Stored procedure        
      let result2 = await pool.request()
        .input('Guid', sql.VarChar(60), Guid)
        .input('App', sql.VarChar, "SOL")
        .execute('PQR.[dbo].[SP_Usuario]')
      res.status(200).send(result2.recordsets[0][0]);
    } catch (err) {
      res.status(400).send(err + " " + _req.body);
    }
  })()
});


tokenes.post("/v1/Usuario/Create", authenticateToken, (req, res) => {
  const salt = bcrypt.genSaltSync(10);

  (async function () {
    try {
      let pool = await sql.connect(config)
      //Stored procedure        
      let result2 = await pool.request()
        .input('clave', sql.VarChar(60), '')
        .input('correo', sql.VarChar(60), req.body.correo)
        .input('nombreCompleto', sql.VarChar(60), req.body.nombreCompleto)
        .input('perfilId', sql.VarChar(60), req.body.perfilId)
        .input('usuario', sql.VarChar(60), req.body.usuario)
        .input('App', sql.VarChar, "SOL")
        .input('claveCifrada', sql.VarChar(60), bcrypt.hashSync(req.body.clave, salt))
        .execute('PQR.[dbo].[SP_Usuario_Crear]')
      res.status(200).send(result2.recordsets[0][0]);
    } catch (err) {
      res.status(400).send(err + " " + req.body);
    }
  })()
});

tokenes.post("/v1/Usuario/Edit", authenticateToken, (req, res) => {
  const salt = bcrypt.genSaltSync(10);

  (async function () {
    try {
      let pool = await sql.connect(config)
      //Stored procedure        
      let result2 = await pool.request()
        .input('guid', sql.VarChar(60), req.body.guid)
        .input('clave', sql.VarChar(60), '')
        .input('correo', sql.VarChar(60), req.body.correo)
        .input('nombreCompleto', sql.VarChar(60), req.body.nombreCompleto)
        .input('perfilId', sql.VarChar(60), req.body.perfilId)
        .input('usuario', sql.VarChar(60), req.body.usuario)
        .input('App', sql.VarChar, "SOL")
        .input('claveCifrada', sql.VarChar(60), bcrypt.hashSync(req.body.clave, salt))
        .execute('PQR.[dbo].[SP_Usuario_Actualizar]')
      res.status(200).send(result2.recordsets[0][0]);
    } catch (err) {
      res.status(400).send(err + " " + req.body);
    }
  })()
});

tokenes.post("/v1/Usuario/Bloq/:Guid", authenticateToken, (req, res) => {
  let Guid = req.params.Guid;

  if (Guid == '') {
    Guid = 0;
  }
  (async function () {
    try {
      let pool = await sql.connect(config)
      //Stored procedure        
      let result2 = await pool.request()
        .input('Guid', sql.VarChar(60), Guid)
        .query("UPDATE TOP(1) [PQR].[dbo].[SEG_Usuario] SET [Bloqueo ]='1', [FechaModificacion]=GETDATE() WHERE [Id]=@Guid")
      res.status(200).send(result2);
    } catch (err) {
      res.status(400).send(err + " " + req.body);
    }
  })()
});

tokenes.get("/v1/User/Prueba", authenticateToken, (_req, res) => {
  res.status(200).send("Ok");
});


module.exports = tokenes;