"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const http_status_1 = __importDefault(require("http-status"));
const globalErrorHandler = (err, req, res, next) => {
    let statusCode = http_status_1.default.INTERNAL_SERVER_ERROR;
    let success = false;
    let message = "Something went wrong!";
    let error = err;
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
            statusCode = http_status_1.default.CONFLICT;
            message = "Duplicate key error";
            error = err.meta;
        }
        else if (err.code === "P2025") {
            statusCode = http_status_1.default.NOT_FOUND;
            message = "Record not found";
            error = err.meta;
        }
        else {
            statusCode = http_status_1.default.BAD_REQUEST;
            message = "Database request error";
            error = err.message;
        }
    }
    else if (err instanceof client_1.Prisma.PrismaClientValidationError) {
        statusCode = http_status_1.default.BAD_REQUEST;
        message = "Validation error";
        error = err.message;
    }
    else if (err instanceof Error) {
        message = err.message;
        error = err.message;
    }
    res.status(statusCode).json({
        success,
        message,
        error,
    });
};
exports.default = globalErrorHandler;
