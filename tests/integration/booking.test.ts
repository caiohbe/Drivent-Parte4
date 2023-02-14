import { prisma } from "@/config";
import supertest from "supertest";
import httpStatus from "http-status";
import app, { init } from "@/app";
import { cleanDb, generateValidToken } from "../helpers";
import faker from "@faker-js/faker";
import * as jwt from "jsonwebtoken";
import {
  createBooking,
  createEnrollmentWithAddress,
  createHotel,
  createRoomWithHotelId,
  createTicket,
  createTicketTypeRemote,
  createTicketTypeWithHotel,
  createUser,
} from "../factories";
import { TicketStatus } from "@prisma/client";

beforeAll(async () => {
    await init();
});

beforeEach(async () => {
    await cleanDb();
});

const server = supertest(app);

describe("GET /booking", () => {
    it("should respond with status 401 if no token is given", async () => {
        const response = await server.get("/booking");
    
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
    
    it("should respond with status 401 if given token is not valid", async () => {
        const token = faker.lorem.word();
    
        const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
    
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
    
    it("should respond with status 401 if there is no session for given token", async () => {
        const userWithoutSession = await createUser();
        const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    
        const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
    
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    describe("when token is valid", () => {
        it("should respond with 404 when user doesn't have a booking yet", async () => {
            const user = await createUser()
            const token = await generateValidToken(user)
            const hotel = await createHotel()
            await createRoomWithHotelId(hotel.id)

            const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
            expect(response.status).toBe(httpStatus.NOT_FOUND)
        })

        it("should respond with 200 when user have a booking", async () => {
            const user = await createUser()
            const token = await generateValidToken(user)
            const hotel = await createHotel()
            const room = await createRoomWithHotelId(hotel.id)
            const booking = await createBooking(user.id, room.id)
            
            const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(httpStatus.OK)
            expect(response.body.id).toEqual(booking.id)
        })
    })
})

describe("POST /booking", () => {
    it("should respond with status 401 if no token is given", async () => {
        const response = await server.post("/booking");
    
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
    
    it("should respond with status 401 if given token is not valid", async () => {
        const token = faker.lorem.word();
    
        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);
    
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
    
    it("should respond with status 401 if there is no session for given token", async () => {
        const userWithoutSession = await createUser();
        const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    
        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);
    
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    describe("when token is valid", () => {
        it("should respond with status 404 when hotelId is not valid", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            await createEnrollmentWithAddress(user);
            
            const noBodyResponse = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ });
            const invalidBodyResponse = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: 0 });

            expect(noBodyResponse.status).toBe(httpStatus.NOT_FOUND)
            expect(invalidBodyResponse.status).toBe(httpStatus.NOT_FOUND)
        })

        it("should respond with status 403 if user's ticket status is not paid", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeWithHotel()
            await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED)

            const hotel = await createHotel()
            const room = await createRoomWithHotelId(hotel.id)            

            const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: room.id });

            expect(response.status).toBe(httpStatus.FORBIDDEN)
        })

        it("should respond with status 403 if user's ticket is remote", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeRemote()
            await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)

            const hotel = await createHotel()
            const room = await createRoomWithHotelId(hotel.id)            

            const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: room.id });

            expect(response.status).toBe(httpStatus.FORBIDDEN)
        })

        it("should respond with status 403 if room capacity is full", async () => {
            const otherUser = await createUser()
            const user = await createUser();
            const token = await generateValidToken(user);
            const otherEnrollment = await createEnrollmentWithAddress(otherUser)
            const enrollment = await createEnrollmentWithAddress(user);            

            const ticketType = await createTicketTypeWithHotel()
            await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
            await createTicket(otherEnrollment.id, ticketType.id, TicketStatus.PAID)

            const hotel = await createHotel()
            const room = await createRoomWithHotelId(hotel.id, 1)
            await createBooking(otherUser.id, room.id)        

            const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: room.id });

            expect(response.status).toBe(httpStatus.FORBIDDEN)
        })

        it("should respond with status 200", async () => {
            const user = await createUser()
            const token = await generateValidToken(user)
            const enrollment = await createEnrollmentWithAddress(user)          

            const ticketType = await createTicketTypeWithHotel()
            await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)

            const hotel = await createHotel()
            const room = await createRoomWithHotelId(hotel.id)

            const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: room.id });

            expect(response.status).toBe(httpStatus.OK)
        })
    })
})

describe("PUT /booking", () => {
    it("should respond with status 401 if no token is given", async () => {
        const response = await server.put("/booking/0");
    
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
    
    it("should respond with status 401 if given token is not valid", async () => {
        const token = faker.lorem.word();
    
        const response = await server.put("/booking/0").set("Authorization", `Bearer ${token}`);
    
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
    
    it("should respond with status 401 if there is no session for given token", async () => {
        const userWithoutSession = await createUser();
        const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    
        const response = await server.put("/booking/0").set("Authorization", `Bearer ${token}`);
    
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    describe("when token is valid", () => {
        it("should respond with status 404 when roomId is not valid", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);

            const ticketType = await createTicketTypeWithHotel()
            await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)

            const hotel = await createHotel()
            const room = await createRoomWithHotelId(hotel.id)
            const booking = await createBooking(user.id, room.id)

            const noBodyResponse = await server.put(`/booking/${booking.id}`).set("Authorization", `Bearer ${token}`).send({ })
            const invalidBodyResponse = await server.put(`/booking/${booking.id}`).set("Authorization", `Bearer ${token}`).send({ roomId: 0 })

            expect(noBodyResponse.status).toBe(httpStatus.NOT_FOUND)
            expect(invalidBodyResponse.status).toBe(httpStatus.NOT_FOUND)
        })

        it("should respond with status 403 if user does not have a booking", async () => {
            const user = await createUser();
            const otherUser = await createUser()
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const otherEnrollment = await createEnrollmentWithAddress(otherUser)

            const ticketType = await createTicketTypeWithHotel()
            await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
            await createTicket(otherEnrollment.id, ticketType.id, TicketStatus.PAID)

            const hotel = await createHotel()       
            const room = await createRoomWithHotelId(hotel.id)
            const otherRoom = await createRoomWithHotelId(hotel.id)

            const otherBooking = await createBooking(otherUser.id, room.id)
            const booking = await createBooking(user.id, room.id)

            const response = await server.put(`/booking/${otherBooking.id}`).set("Authorization", `Bearer ${token}`).send({ roomId: otherRoom.id })
            
            expect(response.status).toBe(httpStatus.FORBIDDEN)
        })

        it("should respond with status 403 if room capacity is full", async () => {
            const otherUser = await createUser()
            const user = await createUser();
            const token = await generateValidToken(user);
            const otherEnrollment = await createEnrollmentWithAddress(otherUser)
            const enrollment = await createEnrollmentWithAddress(user);            

            const ticketType = await createTicketTypeWithHotel()
            await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
            await createTicket(otherEnrollment.id, ticketType.id, TicketStatus.PAID)

            const hotel = await createHotel()
            const room = await createRoomWithHotelId(hotel.id, 1)
            const otherRoom = await createRoomWithHotelId(hotel.id, 1)

            await createBooking(otherUser.id, otherRoom.id)
            const booking = await createBooking(user.id, room.id)

            const response = await server.put(`/booking/${ booking.id }`).set("Authorization", `Bearer ${token}`).send({ roomId: otherRoom.id });

            expect(response.status).toBe(httpStatus.FORBIDDEN)
        })
        
        it("should respond with status 200",async () => {
            const otherUser = await createUser()
            const user = await createUser();
            const token = await generateValidToken(user);
            const otherEnrollment = await createEnrollmentWithAddress(otherUser)
            const enrollment = await createEnrollmentWithAddress(user);            

            const ticketType = await createTicketTypeWithHotel()
            await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
            await createTicket(otherEnrollment.id, ticketType.id, TicketStatus.PAID)

            const hotel = await createHotel()
            const room = await createRoomWithHotelId(hotel.id, 2)
            const otherRoom = await createRoomWithHotelId(hotel.id, 2)

            await createBooking(otherUser.id, otherRoom.id)
            const booking = await createBooking(user.id, room.id)

            const response = await server.put(`/booking/${ booking.id }`).set("Authorization", `Bearer ${token}`).send({ roomId: otherRoom.id });

            expect(response.status).toBe(httpStatus.OK)
        })
    })
})