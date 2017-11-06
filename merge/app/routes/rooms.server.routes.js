const rooms = require('../controllers/rooms.server.controller');
module.exports = function (app) {
    /*
        app.route('/api/rooms/updateStatus')
            .post(rooms.updateStatus);

    */

//    basically in current config all mutate methods are restricted and all accessors are free

    app.route('/api/getToken')
        .post(rooms.getToken);

    app.route('/api/rooms')
        .get(rooms.listRooms)
        .post(rooms.verifyToken,rooms.needsToBeAdmin,rooms.createRoom);

    app.route('/api/rooms/status')
        .post(rooms.verifyToken,rooms.needsToBeAdmin,rooms.updateStatus);

    app.route('/api/rooms/participants')
        .post(rooms.verifyToken,rooms.needsToBeAdmin,rooms.addParticipants);

    app.route('/api/rooms/participants/:roomName')
        .get(rooms.listParticipants);

    app.param('roomName', rooms.getParticipants);
}