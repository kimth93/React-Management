const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

const data = fs.readFileSync('./database.json');
const conf = JSON.parse(data);
const mysql = require('mysql');

// const connection = mysql.createConnection({
//     host : conf.host,
//     user: conf.user,
//     password : conf.password,
//     port : conf.port,
//     database : conf.database
// });

var connection;

//데이터베이스 끊김 방지
function handleDisconnect() {
    connection = mysql.createConnection({
        host : conf.host,
        user: conf.user,
        password : conf.password,
        port : conf.port,
        database : conf.database
    });

    connection.connect(function(err) {
        if(err) {                            
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 2000); 
          }    
    });

    connection.on('error', function(err) {
        console.log('db error', err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST') { 
          return handleDisconnect();                      
        } else {                                    
          throw err;                              
        }
      });
}

handleDisconnect();

//connection.connect();

const multer = require('multer');
const { connect } = require('http2');
const upload = multer({dest: './upload'})


// app.get('/api/customers', (req, res) => {
//     pool.getConnection(function (err, connection) {
//         connection.query(
//             "SELECT * FROM CUSTOMER",
//             function(err,rows){
//                 res.send(rows);

//                 connection.release();
//             }
    
//         );
//     });
// });

app.get('/api/customers', (req, res) => {
    connection.query(
        "SELECT * FROM CUSTOMER WHERE isDeleted = 0 ",
        (err, rows, fields) => {
            res.send(rows);
        }

    );
});

app.use('/img', express.static('./upload'));    //업로드 폴더를 img라는 이름으로 공유

app.post('/api/customers', upload.single('img'), (req,res) => {
    let sql = 'INSERT INTO CUSTOMER VALUES (null, ?,?,?,?,?, now(),0)';
    let img = 'http://localhost:5000/img/' + req.file.filename;
    let name = req.body.name;
    let birthday = req.body.birthday;
    let gender = req.body.gender;
    let job = req.body.job;

    let params = [img, name, birthday, gender, job];
    connection.query(sql, params,
        (err,rows,fields) => {
            res.send(rows);
        }
    );

});


app.delete('/api/customers/:id', (req, res) => {
    let sql = 'UPDATE CUSTOMER SET isDeleted = 1 where id =?';
    let params = [req.params.id];
    connection.query(sql, params,
        (err, rows, fields) => {
            res.send(rows);
        }
    )
});

app.listen(port, () => console.log(`Listening on port ${port}`));