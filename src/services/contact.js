const { Sequelize } = require('sequelize');
const db = require('../../database/models/index');

// type Contact = {
//     email: string;
//     phone: string;
// };

//contact response
const identifyContact = async (contact) => {
    const allLinkedContacts = await db.Contact.findAll({
        where:
            Sequelize.or({
                email: contact.email
            }, {
                phoneNumber: contact.phoneNumber !== null ? contact.phoneNumber.toString() : ""
            },)
    });
    //if no linked contacts
    if (allLinkedContacts === null || allLinkedContacts.length === 0) {
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
            const primaryContact = allLinkedContacts.filter((contact) => contact.linkPrecedence === 'primary');
            const contactResponse = {
                contact: {
                    primaryContactId: primaryContact[0].id,
                    emails: allLinkedContacts.map((contact) => contact.email),
                    phoneNumbers: allLinkedContacts.map((contact) => contact.phoneNumber),
                    secondaryContactIds: allLinkedContacts.filter((contact) => contact.linkPrecedence === 'secondary').map((contact) => contact.id),
                }
            };
            return contactResponse;
        }

        //creating secondary contact when only one primary contact exists
        if (allLinkedContacts.length === 1 && allLinkedContacts[0].linkPrecedence === 'primary') {
            //if email and phone number are not same
            if (contact.email !== allLinkedContacts[0].email || contact.phoneNumber.toString() !== allLinkedContacts[0].phoneNumber) {
                if (contact.email === null) {
                    await db.Contact.create({
                        email: allLinkedContacts[0].email,
                        phoneNumber: contact.phoneNumber.toString(),
                        linkPrecedence: 'secondary',
                        linkedId: allLinkedContacts[0].id,
                    });
                }
                else if (contact.phoneNumber === null) {
                    await db.Contact.create({
                        email: contact.email,
                        phoneNumber: allLinkedContacts[0].phoneNumber.toString(),
                        linkPrecedence: 'secondary',
                        linkedId: allLinkedContacts[0].id,
                    });
                }
                else {
                    const newLinkedContact = await db.Contact.create({
                        email: contact.email !== allLinkedContacts[0].email ? contact.email : allLinkedContacts[0].email,
                        phoneNumber: contact.phoneNumber !== allLinkedContacts[0].phoneNumber ? contact.phoneNumber.toString() : allLinkedContacts[0].phoneNumber.toString(),
                        linkPrecedence: 'secondary',
                        linkedId: allLinkedContacts[0].id,
                    });
                }

            }
            const linkedContacts = await db.Contact.findAll({
                where:
                    Sequelize.or({
                        email: contact.email
                    }, {
                        phoneNumber: contact.phoneNumber !== null ? contact.phoneNumber.toString() : ""
                    },)
            });
            const emails = linkedContacts.map((contact) => contact.email);
            const uniqueEmails = emails.filter((email, index) => emails.indexOf(email) === index);
            const phoneNumbers = linkedContacts.map((contact) => contact.phoneNumber);
            const uniquePhoneNumbers = phoneNumbers.filter((phoneNumber, index) => phoneNumbers.indexOf(phoneNumber) === index);
            const contactResponse = {
                contact: {
                    primaryContactId: linkedContacts.filter((contact) => contact.linkPrecedence === 'primary')[0].id,
                    emails: uniqueEmails,
                    phoneNumbers: uniquePhoneNumbers,
                    secondaryContactIds: linkedContacts.filter((contact) => contact.linkPrecedence === 'secondary').map((contact) => contact.id),
                }
            };
            return contactResponse;
        }
        else {
            const primaryContacts = allLinkedContacts.filter((contact) => contact.linkPrecedence === 'primary');

            //creating another secondary when matching contact is also secondary
            if (primaryContacts.length == 0) {
                const secondaryContact = allLinkedContacts.filter((contact) => contact.linkPrecedence === 'secondary')[0];
                const primaryContact = await db.Contact.findOne({
                    where: {
                        id: secondaryContact.linkedId,
                    }
                });
                await db.Contact.create({
                    email: contact.email !== secondaryContact.email ? contact.email : secondaryContact.email,
                    phoneNumber: contact.phoneNumber !== secondaryContact.phoneNumber ? contact.phoneNumber.toString() : secondaryContact.phoneNumber.toString(),
                    linkPrecedence: 'secondary',
                    linkedId: primaryContact.id,
                });
                const linkedContacts = await db.Contact.findAll({
                    where: Sequelize.or({ id: primaryContact.id }, { linkedId: primaryContact.id }),
                });
                const emails = linkedContacts.map((contact) => contact.email);
                const uniqueEmails = emails.filter((email, index) => emails.indexOf(email) === index);
                const phoneNumbers = linkedContacts.map((contact) => contact.phoneNumber);
                const uniquePhoneNumbers = phoneNumbers.filter((phoneNumber, index) => phoneNumbers.indexOf(phoneNumber) === index);
                const contactResponse = {
                    contact: {
                        primaryContactId: primaryContact.id,
                        emails: uniqueEmails,
                        phoneNumbers: uniquePhoneNumbers,
                        secondaryContactIds: linkedContacts.filter((contact) => contact.linkPrecedence === 'secondary').map((contact) => contact.id),
                    }
                };
                return contactResponse;
            }

            //creating another secondary contact for primary contact

            if (primaryContacts.length == 1) {
                await db.Contact.create({
                    email: contact.email !== primaryContacts[0].email ? contact.email : primaryContacts[0].email,
                    phoneNumber: contact.phoneNumber !== primaryContacts[0].phoneNumber ? contact.phoneNumber.toString() : primaryContacts[0].phoneNumber.toString(),
                    linkPrecedence: 'secondary',
                    linkedId: primaryContacts[0].id,
                });
                const linkedContacts = await db.Contact.findAll({
                    where: Sequelize.or({ id: primaryContacts[0].id }, { linkedId: primaryContacts[0].id }),
                });
                const emails = linkedContacts.map((contact) => contact.email);
                const uniqueEmails = emails.filter((email, index) => emails.indexOf(email) === index);
                const phoneNumbers = linkedContacts.map((contact) => contact.phoneNumber);
                const uniquePhoneNumbers = phoneNumbers.filter((phoneNumber, index) => phoneNumbers.indexOf(phoneNumber) === index);
                const contactResponse = {
                    contact: {
                        primaryContactId: primaryContacts[0].id,
                        emails: uniqueEmails,
                        phoneNumbers: uniquePhoneNumbers,
                        secondaryContactIds: linkedContacts.filter((contact) => contact.linkPrecedence === 'secondary').map((contact) => contact.id),
                    }
                };
                return contactResponse;

            }
            const recentPrimaryContactId = primaryContacts.sort((a, b) => a.createdAt - b.createdAt)[1].id;
            const oldestPrimaryContactId = primaryContacts.sort((a, b) => a.createdAt - b.createdAt)[0].id;

            await db.Contact.update({
                linkPrecedence: 'secondary',
                linkedId: oldestPrimaryContactId,
            }, {
                where: {
                    id: recentPrimaryContactId,
                }
            });
            const linkedContacts = await db.Contact.findAll({
                where: {
                    linkedId: oldestPrimaryContactId,
                }
            });

            const emails = linkedContacts.map((contact) => contact.email);
            const uniqueEmails = emails.filter((email, index) => emails.indexOf(email) === index);
            const phoneNumbers = linkedContacts.map((contact) => contact.phoneNumber);
            const uniquePhoneNumbers = phoneNumbers.filter((phoneNumber, index) => phoneNumbers.indexOf(phoneNumber) === index);
            const contactResponse = {
                contact: {
                    primaryContactId: oldestPrimaryContactId,
                    emails: uniqueEmails,
                    phoneNumbers: uniquePhoneNumbers,
                    secondaryContactIds: linkedContacts.filter((contact) => contact.linkPrecedence === 'secondary').map((contact) => contact.id),
                }
            };
            return contactResponse;
        }

    }
};

module.exports = { identifyContact };