import { AuthenticatedRequest } from "@/middlewares";
import { Response } from "express";
import httpStatus from "http-status";
import bookingService from "@/services/booking-service";

export async function getBooking(req: AuthenticatedRequest, res: Response) {
    const { userId } = req 

    try {
        const booking = await bookingService.getBooking(userId)
        res.send(booking).status(httpStatus.OK)
    } catch (error) { 
        if (error.name === "NotFoundError") {
            return res.sendStatus(httpStatus.NOT_FOUND);
        }
    }
}

export async function postBooking(req: AuthenticatedRequest, res: Response) {
    const { userId } = req 
    const { roomId } = req.body

    try {
        const booking = await bookingService.postBookin(userId, roomId)
        res.status(httpStatus.OK).send(booking)
    } catch (error) { 
        if (error.name === "NotFoundError") {
            return res.sendStatus(httpStatus.NOT_FOUND);
        }
        if (error.name === "CannotBookError") {
            return res.sendStatus(httpStatus.FORBIDDEN)
        }
    }
}

export async function putBooking(req: AuthenticatedRequest, res: Response) {
    const { userId } = req  
    const roomId = req.body.roomId
    const bookingId = +req.params.bookingId

    try {
        const booking = await bookingService.putBooking(userId, roomId, bookingId)
        res.status(httpStatus.OK).send(booking)
    } catch (error) { 
        if (error.name === "NotFoundError") {
            return res.sendStatus(httpStatus.NOT_FOUND);
        }
        if (error.name === "CannotBookError") {
            return res.sendStatus(httpStatus.FORBIDDEN)
        }
    }
}