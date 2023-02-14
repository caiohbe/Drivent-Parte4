import { Router } from "express";
import { getDefaultEvent } from "@/controllers";
import { authenticateToken } from "@/middlewares";
import { getBooking, postBooking, putBooking } from "../controllers/booking-controller"

const eventsRouter = Router();

eventsRouter.get("/", getDefaultEvent)

eventsRouter
    .all("*/", authenticateToken)
    .get("/", getBooking)
    .post("/", postBooking)
    .put("/:bookingId", putBooking)

export { eventsRouter };
