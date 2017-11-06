const mongoose = require('mongoose');
const crypto = require('crypto');
const Schema = mongoose.Schema;
/*
    note that this collection will likely be massive, the alternative is to create a separate collection for every room which while possible does feel a little silly
    atleast at the poc level as such messages will be stored wholesale and indexed by roomName which will be searched often
    that way adding a message will be a small scale write and not a loare one, and the database calls
    will be fairly static as well

*/
RoomMessageSchema = new Schema({
    roomName : {
        type : String,
        // again making this a ref would be very inefficient
        required: 'roomName is empty',
        index : true
    },
    text : {
        type : String,
        required : "you can\'t send empty messages"
    },
    username: {
        // username, again could use object id but dont see why a load of like 2 /3x is worth it
        // on second thought will use this as populate can only use select fields and user id is still 
        // passed / known
        type : Schema.ObjectId,
        ref: 'User'
    },
    created : {
        type : Date,
        default : Date.now
    }
})

mongoose.model('RoomMessage',RoomMessageSchema)