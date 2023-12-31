const express = require('express');
const app = express();
const cors = require('cors');
require("dotenv").config();
const port = process.env.SERVERPORT||3000


app.get("/dowload/:filename",(req,res)=>{
    const filePath = __dirname + "/UpdateRepository/" + req.params.filename + ".bin";
    res.download(
        filePath, 
        (err) => {
            if (err) {
                res.send({
                    error : err,
                    msg   : "Arquivo Indisponivel"
                })
            }
    });

})


app.listen(port,() =>{
    console.log(`o sev roda na porta ${port} --- link: http://localhost:${port}`);   
    console.log(`o sev roda`); 
});

console.log(__dirname);



