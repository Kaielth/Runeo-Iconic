var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();
//Socket io
var http = require('http').Server(app);
var io = require('socket.io')(http);
//Redistore
var redis = require('redis');
client = redis.createClient();
//Reporte de errores de REDIS
client.on("error", function (err) {
    console.log("Error " + err);
});
//Escuchamos el puerto 3000
http.listen(3000, function(){
    console.log('listening on *:3000');
});
//Aplicacion - El usuario se conecta
io.on('connection', function(socket){
    //Cargamos los mensajes antiguos solo al usuario que se acaba de conectar
    client.lrange("chat:messages", 0, -1, function(error, respuesta){
        if (error){
            console.log("Hubo un error, no jodas: " + error);
        }else{
            socket.emit('chat:messages', respuesta);
        }
    });
    //Enviamos los usuarios conectados
    client.lrange('chat:users-online', 0, -1, function(error, respuesta){
        if (error){
            console.log("Hubo un error, no jodas: " + error);
        }else{
            socket.emit('chat:users-online', respuesta);
        }
    });
    //El usuario se desconecta/conecta y avisamos a los demas
    socket.on('usuario-conectado', function(usuario){
        console.log('Usuario ' + usuario);
        socket.broadcast.emit('usuario-conectado', usuario);
        //Tambien lo registramos, asi podemos decirle a los nuevos usuarios quienes estan conectados
        client.rpush("chat:users-online", usuario, function(error, respuesta){
            if (error){
                console.log("Hubo un error, no jodas" + error);
            }else{
                console.log("Usuario guardado con exito");
            }
        });
    });
    socket.on('usuario-desconectado', function(usuario){
        console.log('Usuario ' + usuario);
        socket.broadcast.emit('usuario-desconectado', usuario);
        //Quitamos el registro del usuario conectado
        client.lrem("chat:users-online", -1, usuario, function(error, respuesta){
            if (error){
                console.log("Hubo un error, no jodas" + error);
            }else{
                console.log("Usuario retirado de la lista");
            }
        });
    });
    //El usuario esta escribiendo
    socket.on('user-writting', function(usr){
        socket.broadcast.emit('user-writting', usr);
    });
    //Recibimos un mensaje, lo enviamos a los demas usuarios y lo guardamos
    socket.on('chat-message', function(msg){
        socket.broadcast.emit('chat-message', msg);
        //Guardamos el usuario
        client.rpush("chat:messages", msg[0], function(error, respuesta){
            if(error){
                console.log("Hubo un error, no jodas" + error);
            }else{
                console.log("Se guardo el usuario del mensaje.");
                client.rpush("chat:messages", msg[1], function(error, respuesta){
                    if(error){
                        console.log("Hubo un error, no jodas" + error);
                    }else{
                        console.log("Se guardo el mensaje del usuario.");
                    }
                });
            }
        });
        //Guardamos su mensaje
    });
});
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
