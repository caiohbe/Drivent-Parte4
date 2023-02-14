import { notFoundError } from "@/errors"
import bookingRepository from "@/repositories/booking-repository"
import ticketRepository from "@/repositories/ticket-repository";
import enrollmentRepository from "@/repositories/enrollment-repository";
import roomRepository from "@/repositories/room-repository";
import { cannotBookError } from "@/errors/cannot-book-error";
import { TicketStatus } from "@prisma/client";

async function validate(userId: number, roomId: number) {
    const enrollment = await enrollmentRepository.findWithAddressByUserId(userId)
    const room = await roomRepository.getRoomById(roomId)
    const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id)

    if (!enrollment || !room || !ticket) {  
        throw notFoundError()
    }
    if (room.capacity === room.Booking.length || ticket.status !== TicketStatus.PAID || ticket.TicketType.isRemote) {
        throw cannotBookError()
    }
}

async function getBooking(userId: number) {
    const booking = await bookingRepository.findBookingByUserId(userId)
    if (!booking) {
        throw notFoundError()
    }
    return booking
}

async function postBookin(userId: number, roomId: number) {
    await validate(userId, roomId)
    const response = bookingRepository.createBooking(userId, roomId)
    return response
}

async function putBooking(userId: number, roomId: number, bookingId: number) {
    await validate(userId, roomId) 
    if(!bookingId || !roomId) {
        throw notFoundError()
    }
    const booking = await bookingRepository.findBookingById(bookingId)    
    if (!booking || booking.userId !== userId) {
        throw cannotBookError()
    }   
    const response = await bookingRepository.updateBooking(bookingId, roomId)
    return response
}

const bookingService = {
    getBooking,
    postBookin,
    putBooking
}

export default bookingService