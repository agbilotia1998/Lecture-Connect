module.exports = function(io, rooms){

  // Establish the connection
  var chatrooms = io.of('/roomlist').on('connection', function(socket){
    console.log('Connection Establish on the server!');
    socket.emit('roomupdate', JSON.stringify(rooms)); // sends it back to the user that created it in the first place.

    // Receive the new room event.
    socket.on('newroom', function(data){
      rooms.push(data); // append the data into the array.
      socket.broadcast.emit('roomupdate', JSON.stringify(rooms)); // doesn't broadcast to the person that created the room.
      socket.emit('roomupdate', JSON.stringify(rooms)); // sends it back to the user that created it in the first place.
    })
  });

  var messages = io.of('/messages').on('connection', function(socket){
    console.log('Connected to the Chatroom!');
    socket.on('joinroom', function(data){
      socket.username = data.user;
      socket.userPic = data.userPic;
      socket.join(data.room); //push user into partitioned room.
      updateUserList(data.room, true);
    });

    socket.on('newMessage', function(data){
      socket.broadcast.to(data.room_number).emit('messagefeed', JSON.stringify(data));
    });

    function updateUserList(room, updateALL){
      var getUsers = io.of('/messages').clients(room);
      var userlist = [];
      for(var i in getUsers){
        userlist.push({
          user:getUsers[i].username,
          userPic:getUsers[i].userPic
        });
      }
      socket.to(room).emit('updateUsersList', JSON.stringify(userlist));

      if(updateALL) {
        socket.broadcast.to(room).emit('updateUsersList')
      }

    }

    socket.on('updateList', function(data){
      updateUserList(data.room);
    })

  });

}
