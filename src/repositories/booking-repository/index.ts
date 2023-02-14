import { prisma } from "@/config"

async function findBookingById(id: number) {
    return await prisma.booking.findFirst({
        where: {
            id
        }
    })
}

async function findBookingByUserId(userId: number) {
    return await prisma.booking.findFirst({
        where: {
            userId
        }
    })
}

async function createBooking(userId: number, roomId: number) {
    return await prisma.booking.create({
        data: {
            userId,
            roomId
        }
    })
}

async function updateBooking(bookingId: number, roomId: number) {
    return await prisma.booking.update({
        data: {
            roomId
        },
        where: {
            id: bookingId
        }
    })
}

const bookingRepository = {
    findBookingById,
    findBookingByUserId,
    createBooking,
    updateBooking
}

export default bookingRepository