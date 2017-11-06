const mongoose = require('mongoose');
const crypto = require('crypto');
const Schema = mongoose.Schema;

RoomDetailsSchema = new Schema({
    roomName: {
        type: String,
        required: 'name is required',
        unique: true
    },
    status: {
        type: String,
        //enum: ['open', 'closed'],
        default: 'open'

    },
    meetingDate: {
        type: Date,
        required: 'meeting date is required'
    },
    participants: {
        type: [{
            type: Schema.ObjectId,
            ref: 'User'
        }]
    },
    created: {
        type: Date,
        default: Date.now
    }



})
// model the new schema
mongoose.model('RoomDetails', RoomDetailsSchema);