const contactService = require('../services/contact.js');

const identifyContact = async (req, res) => {
    try {
        const contact = req.body;
        const identifiedContact = await contactService.identifyContact(contact);
        res.status(200).json(identifiedContact);
    } catch (error) {
        res.status(500).json(error.message);
    }
};

module.exports = { identifyContact };
