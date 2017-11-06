const mongoose = require('mongoose');
const crypto = require('crypto');
const sS = require('../../config/config').sessionSecret;
const jwt = require('jsonwebtoken');

const getErrorMessage = function (err) {
    if (err.errors) {
        for (const errName in err.errors) {
            if (err.errors[errName].message) return err.errors[errName].message;
        }
    } else {
        return 'Unknown server error';
    }
};

module.exports.createRoom = function (req, res) {

    /*
   * req.roomName 
   * req.meetingDate
   */

    let Room = mongoose.model('RoomDetails');
    console.log(req.body)
    let newRoom = new Room(req.body);
    // now try to save

    Room.findOne({ roomName: req.body.roomName }, (err, results) => {
        if (err) {
            console.log(err)
            return res.status(400).send({
                message: getErrorMessage(err)
            });
        } else {
            if (results) {
                return res.status(400).send({
                    message: `roomName must be unique`
                });
            } else {
                newRoom.save((err) => {
                    if (err) {
                        console.log(err + "\n39")
                        return res.status(400).send({
                            message: getErrorMessage(err)
                        });
                    } else {
                        res.json(newRoom)
                    }
                })
            }
        }
    })



}

module.exports.getToken = function (req, res) {

    let User = mongoose.model('User');
    // find the user
    User.findOne({
        username: req.body.username
    }, function (err, user) {

        if (err) { throw err } else {

            if (!user) {
                res.json({ success: false, message: 'Authentication failed. User not found.' });
            } else if (user) {

                if (!(user.password === (crypto.pbkdf2Sync(req.body.password, user.salt, 10000, 64, 'sha256').toString('base64')))) {
                    res.json({ success: false, message: 'Authentication failed. Wrong password.' });
                } else {

                    // if user is found and password is right
                    // create a token with only our given payload
                    // we don't want to pass in the entire user since that has the password
                    // so just user name, status is needed , just for future logging really 
                    const payload = {
                        // need to ut admin into users , boot strap in an admin user
                        admin: user.admin,
                        username: user.username
                        //admin: true
                    };
                    var token = jwt.sign(payload, sS, {
                        expiresIn: "24h"// expires in 24 hours
                    });

                    // return the information including token as JSON
                    res.json({
                        success: true,
                        message: 'Enjoy your token!',
                        token: token
                    });
                }

            }
        }

    });
}
// check user is admin if not throw error
// need to code up
module.exports.needsToBeAdmin = function (req, res, next) {
    if (req.decoded.admin) {
        // if user is admin continue
        next();
    } else {
        //else bad juju
        res.status(203).send({
            message: "user not admin",
            success: false
        })
    }
}
module.exports.verifyToken = function (req, res, next) {

    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    // decode token
    if (token) {

        // verifies secret and checks exp
        jwt.verify(token, sS, function (err, decoded) {
            if (err) {
                return res.json({ success: false, message: 'Failed to authenticate token.' });
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;
                next();
            }
        });

    } else {

        // if there is no token
        // return an error
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });

    }
}

module.exports.updateStatus = function (req, res) {
    /*
    * req.body.roomName 
    * req.body.newRoomStatus
    */

    if (!req.body.roomName) {
        console.log(req.body.roomName);
        res.status(400).send({
            message: `roomName needs to be passed to search for a participant`
        })
    } else {
        const Room = mongoose.model('RoomDetails');
        console.log(req.body.newRoomStatus);
        Room.findOne(
            { roomName: req.body.roomName },
            (err, room) => {
                // if error or a room wasnt returned
                if (err) {
                    res.status(400).send({
                        error: getErrorMessage(err)
                    });
                } else {
                    console.log(room)
                    if (!room) {
                        res.status(400).send({
                            error: "room doesnt exist"
                        });
                    } else {
                        room.status = req.body.newRoomStatus;
                        room.save((err, doc, numAffected) => {
                            if (err) {
                                res.status(400).send({
                                    message: getErrorMessage(err)
                                });
                            } else {
                                if (numAffected === 1) {
                                    res.status(200).send({
                                        message: doc
                                    });
                                } else {
                                    res.status(400).send({
                                        message: "no documents were saved"
                                    });
                                }
                            }
                        });
                    }
                }
            }
        );

    }
}

// for an rpc style get rooms
module.exports.listRooms = function (req, res) {
    /* 
    * res.roomName,
    * res.status
    * res.meetingDate
    * res.created
    */
    const Room = mongoose.model('RoomDetails');

    Room.find((err, results) => {
        if (err) {
            return res.status(400).send({
                message: getErrorMessage(err)
            });
        } else {
            res.json(results);
        }
    })
}
module.exports.listParticipants = function (req, res) {
    if (req.room) {
        res.status(200).send({
            roomName: req.room.roomName,
            participants: req.room.participants
        });
    } else {
        res.status(400).send({
            message: "could not load room"
        })
    }
}

module.exports.getParticipants = function (req, res, next, roomname) {
    /*
    * roomName 
    */
    if (req.body.roomname) {
        console.log(roomname);
        res.status(400).send({
            message: `roomName needs to be passed to search for a participant`
        })
    } else {
        const Room = mongoose.model('RoomDetails');
        // will find all
        // should populate user referenced fields hopefully will do it for each, but feels edgy, not super needed though, can just make it usernames
        Room.findOne({ roomName: roomname })
            .populate('participants', 'username firstName lastName email')
            .exec((err, results) => {
                if (err) {
                    res.status(400).send({
                        message: getErrorMessage(err)
                    });
                } else {
                    req.room = results;
                    next();
                }
            });
        // will run above asynchronously and therefore not kill server
    }
}
//{ $push: { scores: { $each: [ 90, 92, 85 ] } } }
module.exports.addParticipants = function (req, res) {
    Room = mongoose.model('RoomDetails');
    /*
    * req.body.roomName 
    * req.body.participants
    */

    // attempt 2 using $ push and upsert insert i non existant ese up
    // may be better to load then save but will see
    // might be even better to do a create on creation of room
    Room.update({
        //query
        roomName: req.body.roomName
    }, {
            //doc
            $push: { participants: { $each: req.body.participants } }
        }, {
            // opts
            upsert: true,
            setDefaultsOnInsert: true
        },
        // cb
        (err) => {
            if (err) {
                res.status(400).send({
                    message: getErrorMessage(err)
                });
            } else {
                res.status(200).send({
                    message: true
                })
            }
        })

}

