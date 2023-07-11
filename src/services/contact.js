const db = require('../../database/models/index');

// type Contact = {
//     email: string;
//     phone: string;
// };

//contact response
const identifyContact = async (contact) => {
    const isLinked = await db.Contact.findOne({
        where: {
            email: contact.email,
            phoneNumber: contact.phoneNumber.toString(),
        },
    });
    if (isLinked === null) {
        const newContact = await db.Contact.create({
            email: contact.email,
            phoneNumber: contact.phoneNumber.toString(),
            linkedPrecedence: 'primary',
        });
        const contactResponse = {
            contact: {
                primaryContactId: newContact.id,
                emails: [newContact.email],
                phoneNumbers: [newContact.phoneNumber],
                secondaryContactIds: [],
            }
        };
        return contactResponse;
    }
};

module.exports = { identifyContact };