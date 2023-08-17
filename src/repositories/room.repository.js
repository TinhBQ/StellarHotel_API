import { roomModel, typeRoomModel, bookingRoomModel } from '../models/index.js';
import Exception from '../exceptions/Exception.js';
import { TYPE_BED } from '../global/constants.js';
import { OutputTypeDebug, printDebug } from '../helpers/printDebug.js';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

const getNumberAvailableRooms = async ({ typeRoom, checkinDate, checkoutDate }) => {
    // Kiểm tra có tồn tại loại phòng không
    const existingTypeRoom = await typeRoomModel.findById(typeRoom);
    if (!existingTypeRoom) {
        printDebug('Không tồn tại loại phòng', OutputTypeDebug.INFORMATION);
        throw new Exception(Exception.GET_NUMBER_AVAILABLE_ROOMS_FAILED);
    }

    // Lấy só lượng phòng theo mã phòng
    const getNumberRoomsByTypeRoom = await roomModel
        .find({ typeRoom: existingTypeRoom.id })
        .exec()
        .then((results) => results.length)
        .catch(() => 0);
    printDebug(`getNumberRoomsByTypeRoom: ${getNumberRoomsByTypeRoom}`, OutputTypeDebug.INFORMATION);

    const getNumberRoomsBookedByDate = await bookingRoomModel
        .find({
            checkinDate: { $gte: checkinDate },
            checkoutDate: { $lte: checkoutDate },
        })
        .exec()
        .then((elements) => elements.map((element) => element.quantity).reduce((partialSum, a) => partialSum + a, 0))
        .catch(() => 0);
    printDebug(`getNumberRoomsBookedByDate: ${getNumberRoomsBookedByDate}`, OutputTypeDebug.INFORMATION);

    return { result: getNumberRoomsByTypeRoom - getNumberRoomsBookedByDate };
};

const addRoom = async (idTypeRoom, link_img, acreage, typeBed, capacity, view, prices, status) => {
    let existingTypeRoom = await typeRoomModel.findById(idTypeRoom);
    if (!existingTypeRoom) {
        throw new Exception(Exception.TYPE_ROOM_NOT_EXIST);
    }
    let Room = await roomModel.create({
        idTypeRoom: existingTypeRoom._id,
        image: link_img,
        acreage,
        typeBed: TYPE_BED[typeBed],
        capacity,
        view,
        prices,
        status,
    });
    if (!Room) {
        throw new Exception(Exception.CANNOT_ADD_ROOM);
    }
    return {
        id: Room._id,
        typeRoom: existingTypeRoom.name,
        image: Room.image,
        description: existingTypeRoom.description,
        acreage: Room.acreage,
        typeBed: Room.typeBed,
        capacity: Room.capacity,
        view: Room.view,
        prices: Room.prices,
        status: Room.status,
    };
};

const updateRoom = async (name, roomNumber, image, acreage, typeBed, capacity, view, prices, status) => {
    try {
        let existingTypeRoom = await typeRoomModel.findOne({ name });
        let existingRoom = await roomModel.findOne({ roomNumber });

        if (!existingTypeRoom) {
            throw new Error('TYPE_ROOM_NOT_EXIST');
        } else if (!existingRoom) {
            throw new Error('ROOM_NOT_EXIST');
        } else {
            existingRoom.typeRoom = existingTypeRoom.id ?? existingRoom.typeRoom;
            existingRoom.image = image ?? existingRoom.image;
            existingRoom.acreage = acreage ?? existingRoom.acreage;
            existingRoom.typeBed = TYPE_BED[typeBed] ?? existingRoom.typeBed;
            existingRoom.capacity = capacity || existingRoom.capacity;
            existingRoom.view = view ?? existingRoom.view;
            existingRoom.prices = prices ?? existingRoom.prices;
            existingRoom.status = status ?? existingRoom.status;

            await existingRoom.save();

            return {
                id: existingRoom._id,
                typeRoom: existingTypeRoom.name,
                roomNumber: existingRoom.roomNumber,
                image: existingRoom.image,
                description: existingTypeRoom.description,
                acreage: existingRoom.acreage,
                typeBed: existingRoom.typeBed,
                capacity: existingRoom.capacity,
                view: existingRoom.view,
                prices: existingRoom.prices,
                status: existingRoom.status,
            };
        }
    } catch (error) {
        console.error(error.message);
        if (error.message === 'TYPE_ROOM_NOT_EXIST' || error.message === 'ROOM_NOT_EXIST') {
            throw error;
        } else {
            throw 'UPDATE_ROOM_FAILED';
        }
    }
};

export default { getNumberAvailableRooms, addRoom, updateRoom };
