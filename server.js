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
const XlsxPopulate = require('xlsx-populate');


app.use(cors())

var combos = require('./subPag/combos');
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
 * Cargar las Periodos asignadas a un usuario
 */
app.get("/v1/SOL/Periodos", authenticateToken, function (req, res) {
    (async function () {
        try {
            let pool = await sql.connect(config)
            //Stored procedure    
            let result2 = await pool.request()
                .execute('dbo.SP_Obtener_Periodos')

            res.status(200).send(result2.recordset);
        } catch (err) {
            res.status(400).send(result2);
        }
    })()
});

/**
 * Activa un periodo
 */
app.post("/v1/SOL/Periodo", authenticateToken, function (req, res) {
    let Guid = req.body.PeriodoId;

    if (Guid == '') {
        Guid = 0;
    }

    (async function () {
        try {
            let pool = await sql.connect(config)
            //Stored procedure    
            let result2 = await pool.request()
                .input('PeriodoId', sql.Int, Guid)
                .execute('dbo.SP_Activar_Periodo')

            res.status(200).send(result2.recordset);
        } catch (err) {
            res.status(400).send(result2);
        }
    })()
});

/**
 * Activa un periodo
 */
app.post("/v1/SOL/Periodos/Crear", authenticateToken, function (req, res) {
    (async function () {
        try {

            const Departamentos = new sql.Table();
            Departamentos.columns.add('Value', sql.Int);

            req.body.Departamentos.forEach((Departamento) => {
                Departamentos.rows.add(Departamento);
            });

            let pool = await sql.connect(config)
            //Stored procedure    
            let result2 = await pool.request()
                .input('Periodo', sql.VarChar, req.body.Periodo)
                .input('Departamentos', Departamentos)
                // .input('FechaActivacion', sql.Date, req.body.FechaActivacion)
                // .input('FechaCierre', sql.Date, req.body.FechaFin)
                // .input('FechaFin', sql.Date, req.body.FechaCierre)
                .execute('dbo.SP_Crear_Periodo')

            res.status(200).send(result2.recordset);
        } catch (err) {
            res.status(400).send(result2);
        }
    })()
});


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
                .execute('dbo.SP_Obtener_Usuario_Sedes_A_Encuestar')

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
 * Activa un periodo
 */
app.post("/v1/SOL/Sedes/Crear", authenticateToken, function (req, res) {
    (async function () {
        try {
            let pool = await sql.connect(config)
            //Stored procedure    
            let result2 = await pool.request()
                .input('EmpresaId', sql.Int, req.body.EmpresaId)
                .input('Sede', sql.VarChar, req.body.Sede)
                .input('UsuarioId', sql.VarChar, req.body.UsuarioId)
                .input('Base', sql.Int, req.body.Base)
                .input('Tipo', sql.VarChar, req.body.Tipo)
                .input('Codigo', sql.VarChar, req.body.Codigo)
                .input('DepartamentoId', sql.Int, req.body.DepartamentoId)
                .execute('dbo.SP_Crear_Sede')

            res.status(200).send(result2.recordset);
        } catch (err) {
            res.status(400).send(result2);
        }
    })()
});

/**
 * Activa un periodo
 */
app.post("/v1/SOL/Sedes/Editar/:SedeId", authenticateToken, function (req, res) {
    (async function () {
        try {
            let Guid = req.params.SedeId;
            let pool = await sql.connect(config)
            //Stored procedure    
            let result2 = await pool.request()
                .input('SedeId', sql.Int, Guid)
                .input('EmpresaId', sql.Int, req.body.EmpresaId)
                .input('Sede', sql.VarChar, req.body.Sede)
                .input('UsuarioId', sql.VarChar, req.body.UsuarioId)
                .input('Base', sql.Int, req.body.Base)
                .input('Tipo', sql.VarChar, req.body.Tipo)
                .input('Codigo', sql.VarChar, req.body.Codigo)
                .input('DepartamentoId', sql.Int, req.body.DepartamentoId)
                .execute('dbo.SP_Editar_Sede')

            res.status(200).send(result2.recordset);
        } catch (err) {
            res.status(400).send(result2);
        }
    })()
});

/**
 * Cargar las sedes para configuracion
 */
app.get("/v1/SOL/Sedes/Encuestadores", authenticateToken, function (req, res) {
    (async function () {
        try {
            let pool = await sql.connect(config)
            //Stored procedure    
            let result2 = await pool.request()
                .execute('dbo.SP_Obtener_Usuarios_Encuestadores')

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
            table.columns.add('PreguntaId', sql.Int, { nullable: false });
            table.columns.add('Valor', sql.Int, { nullable: false });
            table.columns.add('Observacion', sql.VarChar(sql.MAX), { nullable: false });

            req.body.Respuestas.forEach(dato => {
                table.rows.add(dato.Id, dato.Valor, dato.Observacion)
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

    if (Guid == '') {
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

    if (Guid == '') {
        Guid = 0;
    }
    if (Guid2 == '') {
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

    if (Guid2 == '') {
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


/**
 * Cargar pendientes de una sede 
 */
app.get("/v1/SOL/Pendientes/:SedeId", function (req, res) {

    let Guid = req.params.SedeId;

    if (Guid == '') {
        Guid = 0;
    }

    (async function () {
        try {
            let pool = await sql.connect(config)
            //Stored procedure    
            let result2 = await pool.request()
                .input('SedeId', sql.Int, Guid)
                .execute('dbo.SP_Obtener_Pendientes_Sedes')
            res.status(200).send(result2.recordset);
        } catch (err) {
            res.status(400).send(result2);
        }
    })()
});

/**
 * Cargar pendientes de una sede 
 */
app.get("/v1/SOL/PendientesGenerales", function (req, res) {

    (async function () {
        try {
            let pool = await sql.connect(config)
            //Stored procedure    
            let result2 = await pool.request()
                .execute('dbo.SP_Obtener_Pendientes_Generales')
            res.status(200).send(result2.recordset);
        } catch (err) {
            res.status(400).send(result2);
        }
    })()
});

// app.post('/v1/SOL/Delegado', authenticateToken, (req, res) => {
//     (async function () {
//         try {
//             let pool = await sql.connect(config)
//             //Stored procedure        
//             let result2 = await pool.request()
//                 .input('UsuarioId', sql.VarChar(60), req.user.user.Id)
//                 .input('EncuestaId', sql.Int, req.body.EncuestaId)
//                 .input('RespuestaId', sql.Int, req.body.RespuestaId)
//                 .input('DelegadoId', sql.Int, req.body.DelegadoId)
//                 .execute('[dbo].[SP_Editar_Respuesta_Delegado]')
//             res.status(200).send(result2);
//         } catch (err) {
//             res.status(400).send(err + " " + req.body);
//         }
//     })()
// });


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



app.post('/v1/SOL/FechaRealizacion', authenticateToken, (req, res) => {
    (async function () {
        try {
            let pool = await sql.connect(config)
            //Stored procedure        
            let result2 = await pool.request()
                .input('UsuarioId', sql.VarChar(60), req.user.user.Id)
                .input('EncuestaId', sql.Int, req.body.EncuestaId)
                .input('RespuestaId', sql.Int, req.body.RespuestaId)
                .input('Fecha', sql.Date, req.body.Fecha)
                .execute('[dbo].[SP_Editar_Respuesta_FechaRealizacion]')
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

    if (Guid == '') {
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
 * Cargar Respuestas 
 */
app.get("/v1/SOL/Respuestas/Asignadas/:EmpresaId/:DelegadoId", function (req, res) {
    let Guid = req.params.EmpresaId;
    let Guid2 = req.params.DelegadoId;

    if (Guid == '' || Guid == null || !Guid) {
        Guid = 0;
    }

    if (Guid2 == '') {
        Guid2 = 0;
    }

    (async function () {
        try {
            let pool = await sql.connect(config)
            //Stored procedure    
            let result2 = await pool.request()
                .input('EmpresaId', sql.Int, Guid)
                .input('DelegadoId', sql.Int, Guid2)
                .execute('dbo.SP_Obtener_Respuestas_Asignadas')
            res.status(200).send(result2.recordset);
        } catch (err) {
            res.status(400).send(result2);
        }
    })()
});

/**
 * Cargar Encuestas 
 */
app.get("/v1/SOL/EncuestasByPeriodo/:periodoId", authenticateToken, function (req, res) {
    let periodoId = req.params.periodoId;

    if (periodoId == '' || periodoId == null || !periodoId) {
        periodoId = 0;
    }

    (async function () {
        try {
            let pool = await sql.connect(config)
            //Stored procedure    
            let result2 = await pool.request()
                .input('UsuarioId', sql.VarChar(60), req.user.user.Id)
                .input('PeriodoId', sql.Int, periodoId)
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

    if (Guid == '') {
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


/**
 * Cargar Detalles Encuestas 
 */
app.get("/v1/SOL/Reporte/PeriodoActivo", function (req, res) {
    (async function () {
        try {
            let pool = await sql.connect(config)
            //Stored procedure    
            let result2 = await pool.request()
                .execute('[dbo].[Estadistica_Periodo_Activo]')
            res.status(200).send(result2.recordsets);
        } catch (err) {
            res.status(400).send(result2);
        }
    })()
});


/**
 * Cargar Detalles Encuestas 
 */
app.get("/v1/SOL/Reporte/Excel", function (req, res) {
    try {
        sql.connect(config).then(pool => {
            return pool.request()
                .execute('SP_Exportar_Excel')
        }).then(result2 => {
            var fields = Object.keys(result2.recordsets[0][0])
            var replacer = function (key, value) { return value === null ? '' : value }
            var csv = result2.recordsets[0].map(function (row) {
                return fields.map(function (fieldName) {
                    return row[fieldName]
                })
            })
            var csvAnuladas = result2.recordsets[1].map(function (row) {
                return fields.map(function (fieldName) {
                    return row[fieldName]
                })
            })
            csv.unshift(fields);
            csvAnuladas.unshift(fields);
            XlsxPopulate.fromBlankAsync()
                .then(workbook => {
                    workbook.addSheet("Todos_Periodos");

                    workbook.sheet("Sheet1").row(1).style("bold", true);
                    workbook.sheet("Todos_Periodos").row(1).style("bold", true);

                    workbook.sheet("Sheet1").cell("A1").value("INFORME DE EXCEL DE TODAS LAS PREGUNTAS QUE NECESITAN GESTIÓN (1-2-3) EN EL PERIODO ");
                    workbook.sheet("Todos_Periodos").cell("A1").value("INFORME DE EXCEL DE TODOS LOS CASOS PENDIENTES X CERRAR DE TODOS LOS PERIODOS ");

                    workbook.sheet("Sheet1").row(2).style("bold", true);
                    workbook.sheet("Todos_Periodos").row(2).style("bold", true);

                    workbook.sheet("Sheet1").cell("A2").value(csv);
                    workbook.sheet("Todos_Periodos").cell("A2").value(csvAnuladas);

                    let yourDate = new Date()
                    yourDate.toISOString().split('T')[0]

                    const file = `./ReporteVigiasSol-` + yourDate.toISOString().split('T')[0] + `.xlsx`;
                    workbook.toFileAsync(file).then(f => {
                        res.download(file);
                    })


                });

        }).catch(err => {
            res.status(400).send('Error: No encontrado' + err);
        });
    } catch (err) {
        res.status(400).send(result2);
    }
});

/**
 * Cargar Detalles Encuestas 
 */
app.get("/v1/SOL/Reporte/Excel2/:EmpresaId/:DelegadoId", function (req, res) {
    let Guid = req.params.EmpresaId;
    let Guid2 = req.params.DelegadoId;

    if (Guid == '' || Guid == null || !Guid) {
        Guid = 0;
    }

    if (Guid2 == '') {
        Guid2 = 0;
    }

    try {
        sql.connect(config).then(pool => {
            return pool.request()
                .input('EmpresaId', sql.Int, Guid)
                .input('DelegadoId', sql.Int, Guid2)
                .execute('SP_Exportar_Excel2')
        }).then(result2 => {
            var fields = Object.keys(result2.recordsets[0][0])
            var replacer = function (key, value) { return value === null ? '' : value }
            var csv = result2.recordsets[0].map(function (row) {
                return fields.map(function (fieldName) {
                    return row[fieldName]
                })
            })
            csv.unshift(fields);
            XlsxPopulate.fromBlankAsync()
                .then(workbook => {
                    workbook.sheet("Sheet1").row(1).style("bold", true);

                    workbook.sheet("Sheet1").cell("A1").value("INFORME DE EXCEL DE TODAS LAS PREGUNTAS ASIGNADAS A UN DELEGADO Y EMPRESA");

                    workbook.sheet("Sheet1").row(2).style("bold", true);

                    workbook.sheet("Sheet1").cell("A2").value(csv);

                    let yourDate = new Date()
                    yourDate.toISOString().split('T')[0]

                    const file = `./ReporteDelegados-` + yourDate.toISOString().split('T')[0] + `.xlsx`;
                    workbook.toFileAsync(file).then(f => {
                        res.download(file);
                    })


                });

        }).catch(err => {
            res.status(400).send('Error: No encontrado' + err);
        });
    } catch (err) {
        res.status(400).send(result2);
    }
});

app.use('/', combos);
app.use('/', tokenes);


// Sets server port and logs message on success
app.listen(process.env.PORT, () => console.dir("ok" + process.env.PORT + process.env.TOKEN_SECRET));
