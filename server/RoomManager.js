const supercharge = require("@supercharge/strings");
const strutil = supercharge();

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
    let room = this._getroom(options);

    if(!room) return null;

    room.clientIds.push(clientId);
    room.strength++;

    if(!room.isPrivate && !this._isFull(room)) this.roomQueue.push(room);

    return room;
  }

  /**
   * Remove a client
   * @param {string} clientId The client ID to remove
   * @param room The room object associated with the client
   */
  removeclient(clientId, room) {
    room.strength--;
    room.clientIds = room.clientIds.filter((e) => e !== clientId);

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
    console.log(JSON.stringify(this.rooms[roomId]));
    let status = {
      id: roomId,
    };

    if (this.rooms[roomId]) {
      status.valid = true;
      status.isFull = this._isFull(this.rooms[roomId]);
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
    isPrivate: false,
    };
    this.rooms[newRoom.id] = newRoom;
    return newRoom;
  }
}

module.exports = RoomManager;
