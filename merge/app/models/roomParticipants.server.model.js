const mongoose = require('mongoose');
const crypto = require('crypto');
const Schema = mongoose.Schema;
/*
*
*   THIS IS DEPRECIATED
* 
*/
RoomParticipantsSchema = new Schema({
    // doing it this way because you will always have the room list available before participant list
    // as such it is meaningless to join them
    roomName : {
        type: String,
        unique :true
    },
// can pupulate a restricted list of the objects
// array of schema Id's 
    participants: {
        type : [{
            type: Schema.ObjectId,
            ref:'User'
        }]
    }
})

mongoose.model('RoomParticipants',RoomParticipantsSchema);