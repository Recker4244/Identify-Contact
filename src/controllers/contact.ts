const contactService = require('../services/contact.ts');
import {Request, Response} from 'express';

const identifyContact = async (req: Request, res: Response) => {
  try {
    const contact = req.body;
    const identifiedContact = await contactService.identifyContact(contact);
    res.status(200).json(identifiedContact);
  } catch (error: any) {
    res.status(500).json(error.message);
  }
};

module.exports = {identifyContact};
