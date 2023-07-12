const {Sequelize} = require('sequelize');
import db from '../../database/models';
import {ContactInstance} from '../../database/models/contact';

type Contact = {
  email: string;
  phoneNumber: string;
};

//contact response
const identifyContact = async (contact: Contact) => {
  const allLinkedContacts = await db.Contact.findAll({
    where: Sequelize.or(
      {
        email: contact.email,
      },
      {
        phoneNumber:
          contact.phoneNumber !== null ? contact.phoneNumber.toString() : '',
      }
    ),
  });

  //command to generate a model in sequelize
  //npx sequelize-cli model:generate --name Contact --attributes email:string,phoneNumber:string,linkPrecedence:string,linkedId:integer,deletedAt:date

  //if no linked contacts
  if (allLinkedContacts === null || allLinkedContacts.length === 0) {
    const newContact = await db.Contact.create({
      email: contact.email,
      phoneNumber: contact.phoneNumber.toString(),
      linkPrecedence: 'primary',
      linkedId: undefined,
    });
    const contactResponse = {
      contact: {
        primaryContactId: newContact.id,
        emails: [newContact.email],
        phoneNumbers: [newContact.phoneNumber],
        secondaryContactIds: [],
      },
    };
    return contactResponse;
  } else {
    //if searching through just email or phone
    if (contact.email === null || contact.phoneNumber === null) {
      const primaryContact = allLinkedContacts.filter(
        (contact: ContactInstance) => contact.linkPrecedence === 'primary'
      );
      const contactResponse = {
        contact: {
          primaryContactId: primaryContact[0].id,
          emails: allLinkedContacts.map(
            (contact: ContactInstance) => contact.email
          ),
          phoneNumbers: allLinkedContacts.map(
            (contact: ContactInstance) => contact.phoneNumber
          ),
          secondaryContactIds: allLinkedContacts
            .filter(
              (contact: ContactInstance) =>
                contact.linkPrecedence === 'secondary'
            )
            .map((contact: ContactInstance) => contact.id),
        },
      };
      return contactResponse;
    }

    //creating secondary contact when only one primary contact exists
    if (
      allLinkedContacts.length === 1 &&
      allLinkedContacts[0].linkPrecedence === 'primary'
    ) {
      //if email and phone number are not same
      if (
        contact.email !== allLinkedContacts[0].email ||
        contact.phoneNumber.toString() !== allLinkedContacts[0].phoneNumber
      ) {
        if (contact.email === null) {
          await db.Contact.create({
            email: allLinkedContacts[0].email,
            phoneNumber: contact.phoneNumber.toString(),
            linkPrecedence: 'secondary',
            linkedId: allLinkedContacts[0].id,
          });
        } else if (contact.phoneNumber === null) {
          await db.Contact.create({
            email: contact.email,
            phoneNumber: allLinkedContacts[0].phoneNumber?.toString(),
            linkPrecedence: 'secondary',
            linkedId: allLinkedContacts[0].id,
          });
        } else {
          const newLinkedContact = await db.Contact.create({
            email:
              contact.email !== allLinkedContacts[0].email
                ? contact.email
                : allLinkedContacts[0].email,
            phoneNumber:
              contact.phoneNumber !== allLinkedContacts[0].phoneNumber
                ? contact.phoneNumber.toString()
                : allLinkedContacts[0].phoneNumber.toString(),
            linkPrecedence: 'secondary',
            linkedId: allLinkedContacts[0].id,
          });
        }
      }
      const linkedContacts = await db.Contact.findAll({
        where: Sequelize.or(
          {
            email: contact.email,
          },
          {
            phoneNumber:
              contact.phoneNumber !== null
                ? contact.phoneNumber.toString()
                : '',
          }
        ),
      });
      const emails = linkedContacts.map(
        (contact: ContactInstance) => contact.email
      );
      const uniqueEmails = emails.filter(
        (email?: string, index?: number) => emails.indexOf(email) === index
      );
      const phoneNumbers = linkedContacts.map(
        (contact: ContactInstance) => contact.phoneNumber
      );
      const uniquePhoneNumbers = phoneNumbers.filter(
        (phoneNumber?: string, index?: number) =>
          phoneNumbers.indexOf(phoneNumber) === index
      );
      const contactResponse = {
        contact: {
          primaryContactId: linkedContacts.filter(
            (contact: ContactInstance) => contact.linkPrecedence === 'primary'
          )[0].id,
          emails: uniqueEmails,
          phoneNumbers: uniquePhoneNumbers,
          secondaryContactIds: linkedContacts
            .filter(
              (contact: ContactInstance) =>
                contact.linkPrecedence === 'secondary'
            )
            .map((contact: ContactInstance) => contact.id),
        },
      };
      return contactResponse;
    } else {
      const primaryContacts = allLinkedContacts.filter(
        (contact: ContactInstance) => contact.linkPrecedence === 'primary'
      );

      //creating another secondary when matching contact is also secondary
      if (primaryContacts.length == 0) {
        const secondaryContact = allLinkedContacts.filter(
          (contact: ContactInstance) => contact.linkPrecedence === 'secondary'
        )[0];
        const primaryContact = await db.Contact.findOne({
          where: {
            id: secondaryContact.linkedId,
          },
        });
        await db.Contact.create({
          email:
            contact.email !== secondaryContact.email
              ? contact.email
              : secondaryContact.email,
          phoneNumber:
            contact.phoneNumber !== secondaryContact.phoneNumber
              ? contact.phoneNumber.toString()
              : secondaryContact.phoneNumber.toString(),
          linkPrecedence: 'secondary',
          linkedId: primaryContact.id,
        });
        const linkedContacts = await db.Contact.findAll({
          where: Sequelize.or(
            {id: primaryContact.id},
            {linkedId: primaryContact.id}
          ),
        });
        const emails = linkedContacts.map(
          (contact: ContactInstance) => contact.email
        );
        const uniqueEmails = emails.filter(
          (email?: string, index?: number) => emails.indexOf(email) === index
        );
        const phoneNumbers = linkedContacts.map(
          (contact: ContactInstance) => contact.phoneNumber
        );
        const uniquePhoneNumbers = phoneNumbers.filter(
          (phoneNumber?: string, index?: number) =>
            phoneNumbers.indexOf(phoneNumber) === index
        );
        const contactResponse = {
          contact: {
            primaryContactId: primaryContact.id,
            emails: uniqueEmails,
            phoneNumbers: uniquePhoneNumbers,
            secondaryContactIds: linkedContacts
              .filter(
                (contact: ContactInstance) =>
                  contact.linkPrecedence === 'secondary'
              )
              .map((contact: ContactInstance) => contact.id),
          },
        };
        return contactResponse;
      }

      //creating another secondary contact for primary contact

      if (primaryContacts.length == 1) {
        await db.Contact.create({
          email:
            contact.email !== primaryContacts[0].email
              ? contact.email
              : primaryContacts[0].email,
          phoneNumber:
            contact.phoneNumber !== primaryContacts[0].phoneNumber
              ? contact.phoneNumber.toString()
              : primaryContacts[0].phoneNumber.toString(),
          linkPrecedence: 'secondary',
          linkedId: primaryContacts[0].id,
        });
        const linkedContacts = await db.Contact.findAll({
          where: Sequelize.or(
            {id: primaryContacts[0].id},
            {linkedId: primaryContacts[0].id}
          ),
        });
        const emails = linkedContacts.map(
          (contact: ContactInstance) => contact.email
        );
        const uniqueEmails = emails.filter(
          (email?: string, index?: number) => emails.indexOf(email) === index
        );
        const phoneNumbers = linkedContacts.map(
          (contact: ContactInstance) => contact.phoneNumber
        );
        const uniquePhoneNumbers = phoneNumbers.filter(
          (phoneNumber?: string, index?: number) =>
            phoneNumbers.indexOf(phoneNumber) === index
        );
        const contactResponse = {
          contact: {
            primaryContactId: primaryContacts[0].id,
            emails: uniqueEmails,
            phoneNumbers: uniquePhoneNumbers,
            secondaryContactIds: linkedContacts
              .filter(
                (contact: ContactInstance) =>
                  contact.linkPrecedence === 'secondary'
              )
              .map((contact: ContactInstance) => contact.id),
          },
        };
        return contactResponse;
      }

      const recentPrimaryContactId = primaryContacts.sort(
        (a: ContactInstance, b: ContactInstance) =>
          a.createdAt.getTime() - b.createdAt.getTime()
      )[1].id;
      const oldestPrimaryContactId = primaryContacts.sort(
        (a: ContactInstance, b: ContactInstance) =>
          a.createdAt.getTime() - b.createdAt.getTime()
      )[0].id;

      await db.Contact.update(
        {
          linkPrecedence: 'secondary',
          linkedId: oldestPrimaryContactId,
        },
        {
          where: {
            id: recentPrimaryContactId,
          },
        }
      );
      const linkedContacts = await db.Contact.findAll({
        where: {
          linkedId: oldestPrimaryContactId,
        },
      });

      const emails = linkedContacts.map(
        (contact: ContactInstance) => contact.email
      );
      const uniqueEmails = emails.filter(
        (email?: string, index?: number) => emails.indexOf(email) === index
      );
      const phoneNumbers = linkedContacts.map(
        (contact: ContactInstance) => contact.phoneNumber
      );
      const uniquePhoneNumbers = phoneNumbers.filter(
        (phoneNumber?: string, index?: number) =>
          phoneNumbers.indexOf(phoneNumber) === index
      );
      const contactResponse = {
        contact: {
          primaryContactId: oldestPrimaryContactId,
          emails: uniqueEmails,
          phoneNumbers: uniquePhoneNumbers,
          secondaryContactIds: linkedContacts
            .filter(
              (contact: ContactInstance) =>
                contact.linkPrecedence === 'secondary'
            )
            .map((contact: ContactInstance) => contact.id),
        },
      };
      return contactResponse;
    }
  }
};

module.exports = {identifyContact};
