"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const http_status_1 = __importDefault(require("http-status"));
const zod_1 = require("zod");
const AppError_1 = __importDefault(require("../errors/AppError"));
const globalErrorHandler = (err, req, res, next) => {
    let statusCode = http_status_1.default.INTERNAL_SERVER_ERROR;
    let success = false;
    let message = "Something went wrong!";
    let errorSources = err;
    if (err instanceof zod_1.ZodError) {
        statusCode = http_status_1.default.BAD_REQUEST;
        message = "Validation Error";
        errorSources = err.issues.map((issue) => ({
            path: issue.path[issue.path.length - 1],
            message: issue.message,
        }));
    }
    else if (err instanceof AppError_1.default) {
        statusCode = err.statusCode;
        message = err.message;
        errorSources = err.message;
    }
    else if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
            statusCode = http_status_1.default.CONFLICT;
            message = "Duplicate key error: Record already exists.";
            errorSources = err.meta;
        }
        else if (err.code === "P2025") {
            statusCode = http_status_1.default.NOT_FOUND;
            message = "Record not found.";
            errorSources = err.meta;
        }
        else {
            statusCode = http_status_1.default.BAD_REQUEST;
            message = "Database request error";
            errorSources = err.message;
        }
    }
    else if (err instanceof client_1.Prisma.PrismaClientValidationError) {
        statusCode = http_status_1.default.BAD_REQUEST;
        message = "Database validation error";
        errorSources = err.message;
    }
    else if (err instanceof Error) {
        message = err.message;
        errorSources = err.message;
    }
    res.status(statusCode).json({
        success,
        message,
        error: errorSources,
    });
};
exports.default = globalErrorHandler;
