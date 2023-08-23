import { typeRoomModel } from '../models/index.js';
import Exception from '../exceptions/Exception.js';
import { OutputTypeDebug, printDebug } from '../helpers/printDebug.js';

const filterTypeRooms = async ({ page, size, searchString }) => {
    const filterTypeRooms = await typeRoomModel.aggregate([
        {
            $match: {
                $or: [
                    {
                        name: { $regex: `.*${searchString}.*`, $options: 'i' },
                    },
                ],
            },
        },
        {
            $skip: (page - 1) * size,
        },
        {
            $limit: Number(size),
        },
        {
            $project: {
                name: 1,
                image: 1,
                description: 1,
            },
        },
    ]);

    if (!filterTypeRooms) {
        throw new Exception(Exception.DATA_RETRIEVAL_FAILED);
    }

    return filterTypeRooms;
};
const updateTypeRoom = async (idTypeRoom, link_img) => {
    const existingTypeRoom = await typeRoomModel.findByIdAndUpdate(idTypeRoom, {
        image: link_img ?? existingTypeRoom.image,
    }).exec();
    if (!existingTypeRoom) {
        throw new Exception(Exception.TYPE_ROOM_NOT_EXIST);
    }
    return {
        id: existingTypeRoom._id,
        name: existingTypeRoom.name,
        image: existingTypeRoom.image,
        description: existingTypeRoom.description,
    };
};

export default { filterTypeRooms, updateTypeRoom};
