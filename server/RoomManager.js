const supercharge = require("@supercharge/strings");
// Util to generate a random room id
const strutil = supercharge();

/**
 * Manages the room using a simple room queue and a map of room id mapped rooms
 */
class RoomManager {
  constructor() {
    this.rooms = {};
    this.roomQueue = [];
    this.maxStrength = 8;
  }

  /**
   * Assign a room to this client
   * @param {string} clientId The client ID
   * @param options The room options
   * @returns The assigned room
   */
  addclient(clientId, options) {
    // Fetch the room based on the client options
    let room = this._getroom(options);

    // If the room is null, then an abrupt error has occured within the timeframe of post and initialize
    if(!room) return null;

    // Add this client to this room
    room.clientIds.push(clientId);
    room.strength++;

    // Only push the room to queue if not full and not private
    if(!room.isPrivate && !this._isFull(room)) this.roomQueue.push(room);

    // Return the room
    return room;
  }

  /**
   * Remove a client
   * @param {string} clientId The client ID to remove
   * @param room The room object associated with the client
   */
  removeclient(clientId, room) {
    // Remove the client from this room
    // room is provided as a paaram to avoid taking more vars and avoid the search process
    room.strength--;
    // Remove the client
    room.clientIds = room.clientIds.filter((e) => e !== clientId);

    // If the room is still usable, push it to queue if not private
    if (room.strength > 0) {
        if(!room.isPrivate)
            this.roomQueue.push(room);
    }
    else this._deleteRoom(room.id);
  }

  /**
   * Get status of a room
   * @param {string} roomId The room ID
   * @returns Room status
   */
  getStatus(roomId) {
    let status = {
      id: roomId,
    };

    if (this.rooms[roomId]) {
      status.valid = true;
      status.isFull = this._isFull(this.rooms[roomId]);
      status.private = this.rooms[roomId].isPrivate;
    } else {
      status.valid = false;
    }
    return status;
  }

  _isFull(room) {
    return room.strength >= this.maxStrength;
  }

  _deleteRoom(roomId) {
    delete this.rooms[roomId];
  }

  _getroom(options) {
    if (options.hostRoom) {
      let r = this._createNewRoom();
      r.isPrivate = true;
      return r;
    } else if(options.customRoom) {
        let r = this.rooms[options.roomId];
        if(r) {
            if(this._isFull(r)) {
                return null;
            } else {
                return r;
            }
        } else {
            return null;
        }
    }

    if (this.roomQueue.length > 0) {
        return this.roomQueue.shift();
    }

    return this._createNewRoom();
  }

  _createNewRoom() {
    let roomID = strutil.random(6);
    let newRoom = {
        id: roomID, // UID of the room
        strength: 0, // Current strength
        clientIds: [], // The associated clients
        isPrivate: false
    };
    this.rooms[newRoom.id] = newRoom;
    return newRoom;
  }
}

module.exports = RoomManager;
