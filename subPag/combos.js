var express = require('express');
var combos = express.Router();

const sql = require('mssql'),
dotenv = require('dotenv')


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



/**
 * Cargar las sedes asignadas a un usuario
 */
 combos.get("/v1/SOL/Combo/Delegados", function (req, res) {     
    (async function () {
        try {
            let pool = await sql.connect(config)
            //Stored procedure    
            let result2 = await pool.request()
                .execute('dbo.SP_Obtener_Combo_Delegados')

            res.status(200).send(result2.recordset);
        } catch (err) {
            res.status(400).send(result2);
        }
    })()
});


module.exports = combos;
