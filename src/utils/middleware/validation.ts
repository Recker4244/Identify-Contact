import { NextFunction, Request, Response } from "express";

const Joi = require('joi');

const contactSchema = Joi.object({
    email: Joi.string().min(3).max(50),
    phoneNumber: Joi.string().min(3).max(50),
});

const contactValidator = (req: Request, res: Response, next: NextFunction) => {
    const { error } = contactSchema.validate(req.body);
    if (error) {
        res.status(400).json({ error: error.details[0].message });
    } else {
        next();
    }
};

module.exports = { contactValidator };