const { Sequelize } = require('sequelize');
const db = require('../../database/models/index');

// type Contact = {
//     email: string;
//     phone: string;
// };

//contact response
const identifyContact = async (contact) => {
    const linkedPrimaryContacts = await db.Contact.findAll({
        where:
            Sequelize.or({
                email: contact.email
            }, {
                phoneNumber: contact.phoneNumber !== null ? contact.phoneNumber.toString() : ""
            },)
    });
    //if no linked contacts
    if (linkedPrimaryContacts === null || linkedPrimaryContacts.length === 0) {
        const newContact = await db.Contact.create({
            email: contact.email,
            phoneNumber: contact.phoneNumber.toString(),
            linkPrecedence: 'primary',
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
    else {
        //if searching through just email or phone
        if (contact.email === null || contact.phoneNumber === null) {
            const primaryContact = linkedPrimaryContacts.filter((contact) => contact.linkPrecedence === 'primary');
            const contactResponse = {
                contact: {
                    primaryContactId: primaryContact.id,
                    emails: linkedPrimaryContacts.map((contact) => contact.email),
                    phoneNumbers: linkedPrimaryContacts.map((contact) => contact.phoneNumber),
                    secondaryContactIds: linkedPrimaryContacts.filter((contact) => contact.linkPrecedence === 'secondary').map((contact) => contact.id),
                }
            };
            return contactResponse;
        }
        //creating secondary contact when only one primary contact exists
        if (linkedPrimaryContacts.length === 1 && linkedPrimaryContacts[0].linkPrecedence === 'primary') {
            //if email and phone number are not same
            if (contact.email !== linkedPrimaryContacts[0].email || contact.phoneNumber.toString() !== linkedPrimaryContacts[0].phoneNumber) {
                const newLinkedContact = await db.Contact.create({
                    email: contact.email !== linkedPrimaryContacts[0].email ? contact.email : linkedPrimaryContacts[0].email,
                    phoneNumber: contact.phoneNumber !== linkedPrimaryContacts[0].phoneNumber ? contact.phoneNumber.toString() : linkedPrimaryContacts[0].phoneNumber.toString(),
                    linkPrecedence: 'secondary',
                    linkedId: linkedPrimaryContacts[0].id,
                });
            }
            const linkedContacts = await db.Contact.findAll({
                where:
                    Sequelize.or({
                        email: contact.email
                    }, {
                        phoneNumber: contact.phoneNumber !== null ? contact.phoneNumber.toString() : ""
                    },)
            });

            const contactResponse = {
                contact: {
                    primaryContactId: linkedContacts.filter((contact) => contact.linkPrecedence === 'primary')[0].id,
                    emails: linkedContacts.map((contact) => contact.email),
                    phoneNumbers: linkedContacts.filter((item,
                        index) => linkedContacts.indexOf(item) === index).map((contact) => contact.phoneNumber),
                    secondaryContactIds: linkedContacts.map((contact) => contact.id),
                }
            };
            return contactResponse;
        }
        //updating primary to secondary contact
        else {

            await db.Contact.update({
                linkPrecedence: 'secondary',
            }, {
                where: {
                    id: linkedPrimaryContacts.sort((a, b) => a.createdAt - b.createdAt)[1].id,
                }
            });
            const linkedContacts = await db.Contact.findAll({
                where: {
                    linkedId: isLinkedContact.id,
                    linkPrecedence: 'secondary',
                }
            });

            const contactResponse = {
                contact: {
                    primaryContactId: isLinkedContact.id,
                    emails: [isLinkedContact.email].concat(linkedContacts.map((contact) => contact.email)),
                    phoneNumbers: linkedContacts.map((contact) => contact.phoneNumber),
                    secondaryContactIds: linkedContacts.map((contact) => contact.id),
                }
            };
            return contactResponse;
        }

    }
};

module.exports = { identifyContact };