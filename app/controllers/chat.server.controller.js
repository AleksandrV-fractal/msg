// Create the chat configuration
const mongoose = require('mongoose');
//error handling function 
const getErrorMessage = function (err) {
    if (err.errors) {
        for (const errName in err.errors) {
            if (err.errors[errName].message) return err.errors[errName].message;
        }
    } else {
        return 'Unknown server error';
    }
};
// it is an async function so it wont cause the program to hang
saveMessage = async function (message) {
    Message = mongoose.model('RoomMessage');
    msg = new Message(message);
    msg.save((err) => {
        if (err) {
            // if there is an error log it but continue to function
            console.error(getErrorMessage(err));
        }
    })
};

module.exports = function (io, socket) {
    // Emit the status event when a new socket client is connected
    io.emit('chatMessage', {
        type: 'status',
        text: 'connected',
        created: Date.now(),
        roomName: 'testRoom',
        username: socket.request.user.username
    });

    // Send a chat messages to all connected sockets when a message is received 
    socket.on('chatMessage', (message) => {
        message.type = 'message';
        message.created = Date.now();
        message.username = socket.request.user.username;
        //message.roomName = 'testRoom';        
        //save message async
        saveMessage({
            text: message.text,
            username: socket.request.user._id,
            roomName: message.roomName,
            created: Date.now()
        });
        // Emit the 'chatMessage' event
        io.emit('chatMessage', message);
    });

    socket.on('loadRoom', (message) => {
        roomMessage = mongoose.model('RoomMessage')
        // find and replace username with their username fullName etc work too
        roomMessage.find({ roomName: message.roomName }).populate('username', 'username').exec((err, msgs) => {
            if (err) {
                socket.emit('error', err);
            } else {
                socket.emit('roomMessages', msgs);
            }
        })
    });
    socket.on('loadRoomList', (message) => {
        /**
         * basically will make it listen for the request and oush a response,
         * doing it this way lets me do filtering later on as well as mess around with namespaces
         * and or rooms
         */
        console.log('loadroomlist')
        roomDetails = mongoose.model('RoomDetails')
        // find and replace username with their username fullName etc work too
        roomDetails.find({},  'roomName status meetingDate created ', (err, boards) => {
            if (err) {
                socket.emit('error', err);
            } else {
                console.log(boards)
                socket.emit('rrmList', boards );
            }
        })
    });
    // Emit the status event when a socket client is disconnected
    socket.on('disconnect', () => {
        io.emit('chatMessage', {
            type: 'status',
            text: 'disconnected',
            roomName: 'testRoom',
            created: Date.now(),
            username: socket.request.user.username
        });
    });
};
