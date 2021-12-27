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
  database: process.env.BDUSER,
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
            .input('App', sql.VarChar, "SOL")
            .output('Id', sql.VarChar)
            .output('Nombre', sql.VarChar)
            .output('PerfilId', sql.VarChar)
            .output('Perfil', sql.VarChar)
            .output('Mail', sql.VarChar)
            .execute('PQR.dbo.SP_Login')

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
    
    if(Guid == ''){
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
  (async function () {
    try {
        let pool = await sql.connect(config)
        //Stored procedure        
        let result2 = await pool.request()
            .input('clave', sql.VarChar(60), req.body.clave)    
            .input('correo', sql.VarChar(60), req.body.correo)    
            .input('nombreCompleto', sql.VarChar(60), req.body.nombreCompleto)    
            .input('perfilId', sql.VarChar(60), req.body.perfilId)    
            .input('usuario', sql.VarChar(60), req.body.usuario)     
            .input('App', sql.VarChar, "SOL")  
            .execute('PQR.[dbo].[SP_Usuario_Crear]')
        res.status(200).send(result2.recordsets[0][0]);
    } catch (err) {
        res.status(400).send(err + " " + req.body);
    }
})()
});

tokenes.post("/v1/Usuario/Edit", authenticateToken, (req, res) => {
  (async function () {
    try {
        let pool = await sql.connect(config)
        //Stored procedure        
        let result2 = await pool.request()
            .input('guid', sql.VarChar(60), req.body.guid)    
            .input('clave', sql.VarChar(60), req.body.clave)    
            .input('correo', sql.VarChar(60), req.body.correo)    
            .input('nombreCompleto', sql.VarChar(60), req.body.nombreCompleto)    
            .input('perfilId', sql.VarChar(60), req.body.perfilId)    
            .input('usuario', sql.VarChar(60), req.body.usuario)       
            .input('App', sql.VarChar, "SOL")   
            .execute('PQR.[dbo].[SP_Usuario_Actualizar]')
        res.status(200).send(result2.recordsets[0][0]);
    } catch (err) {
        res.status(400).send(err + " " + req.body);
    }
})()
});

tokenes.post("/v1/Usuario/Bloq/:Guid", authenticateToken, (req, res) => {
  let Guid = req.params.Guid;
    
    if(Guid == ''){
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

tokenes.get("/v1/User/Prueba",authenticateToken, (_req, res) => {
  res.status(200).send("Ok");
});


module.exports = tokenes;