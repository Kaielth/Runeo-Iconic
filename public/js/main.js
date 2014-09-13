var chat_rooms = 0; //Numero de salas abiertas
var c = 0;
var socket = io();
var usuario = "anonymous " + Math.floor(Math.random()*1000+1);
//Reportamos que se conecto el usuario
socket.emit('usuario-conectado', usuario);
$(document).ready(function()
{
  //Actualizamos el nombre de usuario
  $('#usuariobtn').html(usuario);
  //Colocamos que el usuario esta conectado
  $('#online-users').append($('<tr id="'+usuario.replace(/ /g, '-')+'">').html("<td><input class='form-control' type='text' value='" + usuario + "' readonly ></td>"));
  //$('#online-users').append($('<li>').html("<b>" + usuario + " ONLINE</b>"));
  //Cambiar el nombre de usuario
  $('#usuariobtn').click(function(event)
  {
    event.preventDefault();
    do{
      usuario = prompt('Cambia tu nombre de usuario');
    }while(usuario == "");
    $('#usuariobtn').html(usuario);
  });
  //Interceptamos el envio del formulario
  $('#msg').bind("keypress",function(event){
    if(event.keyCode != 13)
      return;
    var mensaje = $('#msg').val();
    var bdmsg = [usuario,mensaje];
    //Imprimimos el mensaje para el usuario que lo envio
    $('#messages').append($('<li class="list-group-item">').html("<b>" + bdmsg[0] + "</b>: " + bdmsg[1]));
    //Enviamos el mensaje a los demas
    socket.emit('chat-message', bdmsg);
    $('#msg').val('');
    return false;
  });
  //El usuario se desconecta
  window.onbeforeunload = function(){
    socket.emit('usuario-desconectado', usuario);
  };
  //Avisamos que el usuario esta escribiendo
  $('#msg').keydown(function(){
    socket.emit('user-writting', usuario);
  });
  //Socket IO events
  /*
  : <-- Eventos de Redis
  - <-- Eventos de Javascript
  */
  //Reportamos cuando se conectan o desconectan los usuarios
  socket.on('usuario-conectado', function(usuario){
    $('#messages').append($('<li class="list-group-item">').html("<b>" + usuario + " se ha conectado</b>"));
    $('#online-users').append($('<tr id="'+usuario.replace(/ /g, '-')+'">').html("<td><input class='form-control' type='text' value='" + usuario + " ONLINE' readonly ></td>"));
  });
  //Otro usuario se desconecto
  socket.on('usuario-desconectado', function(usuario){
    $('#messages').append($('<li class="list-group-item">').html("<b>" + usuario + " se ha desconectado</b>"));
    $("#"+usuario.replace(/ /g, '-')).remove();
  });
  //Recibimos un mensaje
  socket.on('chat-message', function(msg){
    $('#messages').append($('<li class="list-group-item">').html("<b>" + msg[0] + "</b>: " + msg[1]));
  });
  //Avisamos que algun usuario esta escribiendo
  socket.on('user-writting', function(user){
    $('#user-std').html(user + " is writting...");
  });
  //Cargamos los mensajes antiguos cuando el usuario se conecta
  socket.on('chat:messages', function(msguh){
    for(var i = 0; i < msguh.length-1; i+=2){
      $('#messages').append($('<li class="list-group-item">').html("<b>" + msguh[i] + "</b>: " + msguh[i+1]));
    }
  });
  //Cargamos los usuarios conectados
  socket.on('chat:users-online', function(usro){
    for(var i = 0; i < usro.length; i++){
      $('#online-users').append($('<tr id="'+usro[i].replace(/ /g, '-')+'">').html("<td><input class='form-control' type='text' value='" + usro[i] + "' readonly ></td>"));
    }
  });
  //Creamos una nueva sesion de chat para el usuario actual
  $('#new-chat-session').click(function(){
    //Pestania
    $('#new-chat-session').before($('<li>')
            .html('<a href="#chat-room' + (++chat_rooms) + '" role="tab" data-toggle="tab">Sala de chat ' + chat_rooms + '</a>'));
    //Sala
    $('#last-chat-room').before($('<div class="tab-pane" id="chat-room' + chat_rooms + '" >').html("<h1>Bienvenido a la sala " + chat_rooms + "</h2>"));
  });
});