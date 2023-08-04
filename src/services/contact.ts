const { Sequelize } = require('sequelize');
import db from '../../database/models';
import { ContactInstance } from '../../database/models/contact';

type Contact = {
  email?: string;
  phoneNumber?: number;
};

const identifyContact = async (contact: Contact) => {
  if (contact.email === undefined && contact.phoneNumber === undefined)
    throw new Error('Email or Phone Number is required');
  //check if any contacts match the email or phone number
  const allLinkedContacts = await getAllLinkedContacts(contact);

  //if no linked contacts
  if (allLinkedContacts === null || allLinkedContacts.length === 0) {

    const newContact = await createNewPrimaryContact(contact);

    const contactResponse = {
      contact: {
        primaryContactId: newContact.id,
        emails: [newContact.email],
        phoneNumbers: [newContact.phoneNumber],
        secondaryContactIds: [],
      },
    };

    return contactResponse;

  }

  else {
    const linkedPrimaryAccount = allLinkedContacts.find(
      (contact: ContactInstance) => contact.linkPrecedence === 'primary'
    );
    if (allLinkedContacts.filter((contact: ContactInstance) => contact.linkPrecedence === 'primary').length > 1) {
      const primaryContacts = allLinkedContacts.filter((contact: ContactInstance) => contact.linkPrecedence === 'primary').sort((a: ContactInstance, b: ContactInstance) => b.createdAt.getTime() - a.createdAt.getTime());
      const oldestPrimaryContactId = primaryContacts[1].id;
      const recentPrimaryContactId = primaryContacts[0].id;
      await changeContactToSecondary(oldestPrimaryContactId, recentPrimaryContactId);
      return await getLinkedContactsToPrimaryAccount(primaryContacts[1]);
    }
    //searching through just phone/email
    if (contact.email === null || contact.phoneNumber === null) {
      return await searchContactByEmailOrPhoneNumber(contact, allLinkedContacts);
    }
    //found one primary account linked
    if (linkedPrimaryAccount != null) {
      const secondaryContactExists = await checkIfSecondaryAccountExists(contact, linkedPrimaryAccount);
      if (secondaryContactExists) {
        return await getLinkedContactsToPrimaryAccount(linkedPrimaryAccount);
      }
      if (linkedPrimaryAccount.email === contact.email && linkedPrimaryAccount.phoneNumber == contact.phoneNumber)
        return await getLinkedContactsToPrimaryAccount(linkedPrimaryAccount);
      return await handleSinglePrimaryAccount(contact, linkedPrimaryAccount);
    }
    else {
      const primaryContactId = allLinkedContacts[0].linkedId;
      const primaryContact = await db.Contact.findOne({
        where: {
          id: primaryContactId
        }
      });
      const check = await checkIfAccountExists(contact);
      if (check)
        return await getLinkedContactsToPrimaryAccount(primaryContact!);

      await createNewSecondaryContact(primaryContactId!, contact.email, contact.phoneNumber);
      return await getLinkedContactsToPrimaryAccount(primaryContact!);
    }

  }
};

const checkIfAccountExists = async (targetContact: Contact) => {
  const contact = await db.Contact.findOne({
    where: {
      email: targetContact.email,
      phoneNumber: targetContact.phoneNumber,
    }
  });
  return contact !== null;
}

const checkIfSecondaryAccountExists = async (targetContact: Contact, linkedPrimaryAccount: ContactInstance) => {
  const secondaryContacts = await findSecondaryContacts(linkedPrimaryAccount.id);
  if (secondaryContacts.length === 0)
    return false;
  const secondaryContact = secondaryContacts.find((contact: ContactInstance) => contact.email === targetContact.email && contact.phoneNumber == targetContact.phoneNumber);
  return secondaryContact !== undefined;
}


const changeContactToSecondary = async (oldestPrimaryContactId: number, recentPrimaryContactId: number) => {

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
};

const searchContactByEmailOrPhoneNumber = async (contact: Contact, allLinkedContacts: ContactInstance[]) => {
  if (contact.email === null) {
    const linkedPrimaryAccount = allLinkedContacts.find(
      (contact: ContactInstance) => contact.linkPrecedence === 'primary'
    );
    if (linkedPrimaryAccount != null && linkedPrimaryAccount.email !== contact.email)
      return await getLinkedContactsToPrimaryAccount(linkedPrimaryAccount);
    else {
      const primaryContactId = allLinkedContacts[0].linkedId;
      const primaryContact = await db.Contact.findOne({
        where: {
          id: primaryContactId
        }
      });
      return await getLinkedContactsToPrimaryAccount(primaryContact);
    }
  }
  if (contact.phoneNumber === null) {
    const linkedPrimaryAccount = allLinkedContacts.find(
      (contact: ContactInstance) => contact.linkPrecedence === 'primary'
    );
    if (linkedPrimaryAccount != null && linkedPrimaryAccount.phoneNumber !== contact.phoneNumber)
      return await getLinkedContactsToPrimaryAccount(linkedPrimaryAccount);
    else {
      const primaryContactId = allLinkedContacts[0].linkedId;
      const primaryContact = await db.Contact.findOne({
        where: {
          id: primaryContactId
        }
      });
      return await getLinkedContactsToPrimaryAccount(primaryContact);
    }

  }
}

const getLinkedContactsToPrimaryAccount = async (linkedPrimaryAccount: ContactInstance) => {
  const secondaryContacts = await findSecondaryContacts(linkedPrimaryAccount.id);
  const secondaryContactsMails = secondaryContacts.map((contact: ContactInstance) => contact.email);
  secondaryContactsMails.push(linkedPrimaryAccount.email);
  const emails = getUniqueEmails(secondaryContactsMails as string[]);

  const secondaryContactsPhoneNumbers = secondaryContacts.map((contact: ContactInstance) => contact.phoneNumber);
  secondaryContactsPhoneNumbers.push(linkedPrimaryAccount.phoneNumber);
  const phoneNumbers = getUniquePhoneNumbers(secondaryContactsPhoneNumbers as number[]);
  const contactResponse = {
    contact: {
      primaryContactId: linkedPrimaryAccount.id,
      emails: emails,
      phoneNumbers: phoneNumbers,
      secondaryContactIds: secondaryContacts.map((contact: ContactInstance) => contact.id),
    },
  };
  return contactResponse;
}

const handleSinglePrimaryAccount = async (contact: Contact, linkedPrimaryAccount: ContactInstance) => {
  const email = linkedPrimaryAccount.email === contact.email ? linkedPrimaryAccount.email : contact.email;
  const phoneNumber = linkedPrimaryAccount.phoneNumber == contact.phoneNumber ? linkedPrimaryAccount.phoneNumber : contact.phoneNumber;
  await createNewSecondaryContact(linkedPrimaryAccount.id, email, phoneNumber);
  const secondaryContacts = await findSecondaryContacts(linkedPrimaryAccount.id);

  const secondaryContactsMails = secondaryContacts.map((contact: ContactInstance) => contact.email);
  secondaryContactsMails.push(linkedPrimaryAccount.email);
  const emails = getUniqueEmails(secondaryContactsMails as string[]);

  const secondaryContactsPhoneNumbers = secondaryContacts.map((contact: ContactInstance) => contact.phoneNumber);
  secondaryContactsPhoneNumbers.push(linkedPrimaryAccount.phoneNumber);
  const phoneNumbers = getUniquePhoneNumbers(secondaryContactsPhoneNumbers as number[]);
  const contactResponse = {
    contact: {
      primaryContactId: linkedPrimaryAccount.id,
      emails: emails,
      phoneNumbers: phoneNumbers,
      secondaryContactIds: secondaryContacts.map((contact: ContactInstance) => contact.id),
    },
  };
  return contactResponse;
}

const getUniqueEmails = (contactEmails: string[]) => {
  const uniqueEmails = contactEmails.filter(
    (email, index) => contactEmails.indexOf(email) === index
  );
  return uniqueEmails;
};

const getUniquePhoneNumbers = (contactPhoneNumbers: number[]) => {
  const uniquePhoneNumbers = contactPhoneNumbers.filter(
    (phoneNumber, index) => contactPhoneNumbers.indexOf(phoneNumber) === index
  );
  return uniquePhoneNumbers;
};

const createNewSecondaryContact = async (linkedId: number, email?: String, phoneNumber?: Number,) => {
  const newSecondaryContact = await db.Contact.create({
    email: email,
    phoneNumber: phoneNumber,
    linkPrecedence: 'secondary',
    linkedId: linkedId,
  });
  return newSecondaryContact;
}

const createNewPrimaryContact = async (contact: Contact) => {
  const newPrimaryContact = await db.Contact.create({
    email: contact.email,
    phoneNumber: contact.phoneNumber?.toString(),
    linkPrecedence: 'primary',
    linkedId: undefined,
  });
  return newPrimaryContact;
}

const getAllLinkedContacts = async (contact: Contact) => {
  const contacts = await db.Contact.findAll({
    where: Sequelize.or(
      {
        email: contact.email,
      },
      {
        phoneNumber:
          contact.phoneNumber !== null ? contact.phoneNumber?.toString() : '',
      }
    ),
  });
  return contacts;
}

const findSecondaryContacts = async (linkedId: Number) => {
  const secondaryContacts = await db.Contact.findAll({
    where: {
      linkedId: linkedId,
    },
  });
  return secondaryContacts;
}

module.exports = { identifyContact };
