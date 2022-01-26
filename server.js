const
    express = require('express'),
    bodyParser = require('body-parser'),
    jwt = require('jsonwebtoken'),
    formidable = require('formidable'),
    dotenv = require('dotenv'),
    mv = require('mv'),
    cors = require('cors'),
    fs = require('fs'),
    XLSX = require('xlsx'),
    app = express().use(bodyParser.json()); // creates express http server
var nodemailer = require('nodemailer');


app.use(cors())

var combos = require('./subPag/combos');
// var combosPqr = require('./subPag/combosPqr');
// var estadistica = require('./subPag/estadistica');
var tokenes = require('./subPag/tokenes');

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



/**
 * Cargar las sedes asignadas a un usuario
 */
app.get("/v1/SOL/Sedes", authenticateToken, function (req, res) {     
    (async function () {
        try {
            let pool = await sql.connect(config)
            //Stored procedure    
            let result2 = await pool.request()
                .input('UsuarioId', sql.VarChar(60), req.user.user.Id)
                .execute('dbo.SP_Obtener_Usuario_Sedes')

            res.status(200).send(result2.recordset);
        } catch (err) {
            res.status(400).send(result2);
        }
    })()
});


/**
 * Cargar las sedes para configuracion
 */
 app.get("/v1/SOL/Sedes/Config", authenticateToken, function (req, res) {     
    (async function () {
        try {
            let pool = await sql.connect(config)
            //Stored procedure    
            let result2 = await pool.request()
                .execute('dbo.SP_Obtener_Sedes_Asignacion')

            res.status(200).send(result2.recordset);
        } catch (err) {
            res.status(400).send(result2);
        }
    })()
});

/**
 * Cargar preguntas
 */
 app.get("/v1/SOL/Preguntas", authenticateToken, function (req, res) {     
    
    (async function () {
        try {
            let pool = await sql.connect(config)
            //Stored procedure    
            let result2 = await pool.request()
                .execute('dbo.SP_Obtener_Preguntas')
            res.status(200).send(result2.recordset);
        } catch (err) {
            res.status(400).send(result2);
        }
    })()
});

/**
 *guardar respuestas
 */
 app.post('/v1/SOL/Respuestas', authenticateToken, (req, res) => {
    (async function () {
        try {
            const table = new sql.Table();
            table.columns.add('PreguntaId', sql.Int, {nullable: false});
            table.columns.add('Valor', sql.Int, {nullable: false});
            table.columns.add('Observacion', sql.VarChar(sql.MAX), {nullable: false});

            req.body.Respuestas.forEach(dato => {
                table.rows.add(dato.Id,dato.Valor,dato.Observacion)
            });

            let pool = await sql.connect(config) 
            //Stored procedure        
            let result2 = await pool.request()
            .input('SedeId', sql.Int, req.body.SedeId)
            .input('UsuarioId', sql.VarChar(60), req.user.user.Id)
            .input('Keys', table)
            .output('EncuestaId', sql.Int)
            .execute('dbo.SP_Guardar_Respuestas')
            res.status(200).send(result2.output);
                
        } catch (err) {
            res.status(400).send(err + " ");
        }
    })()
});



/**
 * Cargar Respuestas 
 */
 app.get("/v1/SOL/Respuestas/:EncuestaId", function (req, res) {  
  
    let Guid = req.params.EncuestaId;
    
    if(Guid == ''){
        Guid = 0; 
    } 
    
    (async function () {
        try {
            let pool = await sql.connect(config)
            //Stored procedure    
            let result2 = await pool.request()
                .input('EncuestaId', sql.Int, Guid)
                .execute('dbo.SP_Obtener_Respuestas')
            res.status(200).send(result2.recordset);
        } catch (err) {
            res.status(400).send(result2);
        }
    })()
});

/**
 * Cargar Respuesta
 */
 app.get("/v1/SOL/Respuesta/:EncuestaId/:RespuestaId", function (req, res) {  
  
    let Guid = req.params.EncuestaId;
    let Guid2 = req.params.RespuestaId;
    
    if(Guid == ''){
        Guid = 0; 
    }     
    if(Guid2 == ''){
        Guid2 = 0; 
    } 
    
    (async function () {
        try {
            let pool = await sql.connect(config)
            //Stored procedure    
            let result2 = await pool.request()
                .input('EncuestaId', sql.Int, Guid)
                .input('RespuestaId', sql.Int, Guid2)
                .execute('dbo.SP_Obtener_Respuesta_Detalladas')
            res.status(200).send(result2.recordset[0]);
        } catch (err) {
            res.status(400).send(result2);
        }
    })()
});


/**
 * Cargar Respuesta Seguimiento
 */
 app.get("/v1/SOL/Seguimiento/:RespuestaId", function (req, res) {  
  
    let Guid2 = req.params.RespuestaId;
  
    if(Guid2 == ''){
        Guid2 = 0; 
    } 
    
    (async function () {
        try {
            let pool = await sql.connect(config)
            //Stored procedure    
            let result2 = await pool.request()
                .input('RespuestaId', sql.Int, Guid2)
                .execute('dbo.SP_Obtener_Respuesta_Seguimiento')
            res.status(200).send(result2.recordset);
        } catch (err) {
            res.status(400).send(result2);
        }
    })()
});

app.post('/v1/SOL/Delegado', authenticateToken, (req, res) => {
    (async function () {
        try {
            let pool = await sql.connect(config)
            //Stored procedure        
            let result2 = await pool.request()
                .input('UsuarioId', sql.VarChar(60), req.user.user.Id)
                .input('EncuestaId', sql.Int, req.body.EncuestaId)
                .input('RespuestaId', sql.Int, req.body.RespuestaId)
                .input('DelegadoId', sql.Int, req.body.DelegadoId)
                .execute('[dbo].[SP_Editar_Respuesta_Delegado]')
                res.status(200).send(result2);
        } catch (err) {
            res.status(400).send(err + " " + req.body);
        }
    })()
});


app.post('/v1/SOL/Indicardor', authenticateToken, (req, res) => {
    (async function () {
        try {
            let pool = await sql.connect(config)
            //Stored procedure        
            let result2 = await pool.request()
                .input('UsuarioId', sql.VarChar(60), req.user.user.Id)
                .input('EncuestaId', sql.Int, req.body.EncuestaId)
                .input('RespuestaId', sql.Int, req.body.RespuestaId)
                .input('Indicador', sql.Int, req.body.Indicador)
                .execute('[dbo].[SP_Editar_Respuesta_Indicador]')
                res.status(200).send(result2);
        } catch (err) {
            res.status(400).send(err + " " + req.body);
        }
    })()
});


app.post('/v1/SOL/Cumplimiento', authenticateToken, (req, res) => {
    (async function () {
        try {
            let pool = await sql.connect(config)
            //Stored procedure        
            let result2 = await pool.request()
                .input('UsuarioId', sql.VarChar(60), req.user.user.Id)
                .input('EncuestaId', sql.Int, req.body.EncuestaId)
                .input('RespuestaId', sql.Int, req.body.RespuestaId)
                .input('Cumplimiento', sql.Int, req.body.Cumplimiento)
                .execute('[dbo].[SP_Editar_Respuesta_Cumplimiento]')
                res.status(200).send(result2);
        } catch (err) {
            res.status(400).send(err + " " + req.body);
        }
    })()
});


app.post('/v1/SOL/Comentario', authenticateToken, (req, res) => {
    (async function () {
        try {
            let pool = await sql.connect(config)
            //Stored procedure        
            let result2 = await pool.request()
                .input('UsuarioId', sql.VarChar(60), req.user.user.Id)
                .input('EncuestaId', sql.Int, req.body.EncuestaId)
                .input('RespuestaId', sql.Int, req.body.RespuestaId)
                .input('Comentario', sql.VarChar(sql.MAX), req.body.Comentario)
                .execute('[dbo].[SP_Editar_Respuesta_Comentario]')
                res.status(200).send(result2);
        } catch (err) {
            res.status(400).send(err + " " + req.body);
        }
    })()
});

/**
 * Cargar Respuestas 
 */
 app.get("/v1/SOL/Respuestas/Detalladas/:EncuestaId", function (req, res) {  
  
    let Guid = req.params.EncuestaId;
    
    if(Guid == ''){
        Guid = 0; 
    } 
    
    (async function () {
        try {
            let pool = await sql.connect(config)
            //Stored procedure    
            let result2 = await pool.request()
                .input('EncuestaId', sql.Int, Guid)
                .execute('dbo.SP_Obtener_Respuestas_Detalladas')
            res.status(200).send(result2.recordset);
        } catch (err) {
            res.status(400).send(result2);
        }
    })()
});


/**
 * Cargar Encuestas 
 */
 app.get("/v1/SOL/Encuestas", authenticateToken, function (req, res) {        
    (async function () {
        try {
            let pool = await sql.connect(config)
            //Stored procedure    
            let result2 = await pool.request()
                .input('UsuarioId', sql.VarChar(60), req.user.user.Id)
                .execute('dbo.SP_Obtener_Encuestas')
            res.status(200).send(result2.recordset);
        } catch (err) {
            res.status(400).send(result2);
        }
    })()
});

/**
 * Cargar Encuestas 
 */
 app.get("/v1/SOL/Encuestas/ALL", authenticateToken, function (req, res) {        
    (async function () {
        try {
            let pool = await sql.connect(config)
            //Stored procedure    
            let result2 = await pool.request()
                .execute('dbo.SP_Obtener_Encuestas_All')
            res.status(200).send(result2.recordset);
        } catch (err) {
            res.status(400).send(result2);
        }
    })()
});

/**
 * Cargar Detalles Encuestas 
 */
 app.get("/v1/SOL/Encuestas/:EncuestaId", function (req, res) {  
  
    let Guid = req.params.EncuestaId;
    
    if(Guid == ''){
        Guid = 0; 
    } 
    
    (async function () {
        try {
            let pool = await sql.connect(config)
            //Stored procedure    
            let result2 = await pool.request()
                .input('EncuestaId', sql.Int, Guid)
                .execute('dbo.SP_Obtener_Encuesta_Detalles')
            res.status(200).send(result2.recordset[0]);
        } catch (err) {
            res.status(400).send(result2);
        }
    })()
});


app.use('/', combos);
app.use('/', tokenes);


// Sets server port and logs message on success
app.listen(process.env.PORT, () => console.dir("ok" + process.env.PORT + process.env.TOKEN_SECRET));
