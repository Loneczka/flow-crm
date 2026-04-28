import { readFile } from 'fs/promises';
import { read, utils } from 'xlsx';
import { db } from '../server/db';
import { users, leads } from '../shared/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';

async function seed() {
  console.log('Rozpoczynam import z pliku Excel...');
  const buf = await readFile('leady-flow-crm.xlsx');
  const workbook = read(buf);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows: any[] = utils.sheet_to_json(worksheet);

  // Users to create
  const usersToCreate = new Set<string>();
  rows.forEach(row => {
    if (row['Przypisany do']) usersToCreate.add(row['Przypisany do'].trim());
    if (row['Dodany przez']) usersToCreate.add(row['Dodany przez'].trim());
  });

  const userMap = new Map<string, string>(); // name -> id
  const defaultPassword = await bcrypt.hash('Flow2024!', 10);

  for (const userName of usersToCreate) {
    if (!userName || userName === '-') continue;
    
    let email = '';
    if (userName.toLowerCase().includes('piotr kazibudzki')) {
      email = 'piotr.kazibudzki@szybkieauto.pl';
    } else {
      const parts = userName.toLowerCase().split(' ');
      email = `${parts[0]}.${parts.length > 1 ? parts[1] : 'user'}@flow.pl`.replace(/[^a-zA-Z0-9.@-]/g, '');
    }

    const existingUser = await db.select().from(users).where(eq(users.email, email));
    
    if (existingUser.length > 0) {
      userMap.set(userName, existingUser[0].id);
    } else {
      console.log(`Tworzenie uzytkownika: ${userName} (${email})`);
      const [newUser] = await db.insert(users).values({
        email,
        password: defaultPassword,
        name: userName,
        role: 'SALES',
        notificationsEnabled: true
      }).returning();
      userMap.set(userName, newUser.id);
    }
  }

  // Admin users are already there, but we just need to get the first admin if mapping fails
  const [admin] = await db.select().from(users).where(eq(users.role, 'ADMIN')).limit(1);

  console.log(`Importowanie leadów (${rows.length} wierszy)...`);
  
  let successCount = 0;
  for (const row of rows) {
    let firstName = String(row['Imię'] || row['Imie'] || row['Klient'] || '').trim();
    let lastName = String(row['Nazwisko'] || '').trim();
    
    if (!firstName && !lastName) continue;
    
    if (firstName && !lastName && firstName.includes(' ')) {
      const parts = firstName.split(' ');
      lastName = parts.pop() || '';
      firstName = parts.join(' ');
    }
    
    if (!lastName) lastName = '-';
    if (!firstName) firstName = '-';

    let email = String(row['Email'] || row['E-mail'] || '').trim();
    if (!email || !email.includes('@')) {
       email = `${firstName.toLowerCase().replace(/[^a-z0-9]/g, '')}.${lastName.toLowerCase().replace(/[^a-z0-9]/g, '')}@brak-emaila.pl`;
    }
    
    const phone = String(row['Telefon'] || row['Nr telefonu'] || '').trim();
    const source = String(row['Źródło'] || row['Zrodlo'] || '').trim() || 'Import';
    const notes = String(row['Notatki'] || row['Notatka'] || '').trim();
    
    let status = 'Nowy';
    if (row['Status']) {
      const s = row['Status'].trim();
      if (['Nowy', 'W_toku', 'Wstrzymany', 'Wniosek', 'Sukces', 'Porazka'].includes(s)) {
        status = s;
      }
    }

    const assignedToName = row['Przypisany do'] ? row['Przypisany do'].trim() : null;
    const createdByName = row['Dodany przez'] ? row['Dodany przez'].trim() : null;

    const assignedToId = assignedToName ? userMap.get(assignedToName) : null;
    const createdById = createdByName ? userMap.get(createdByName) : admin.id;

    let contactDate = null;
    if (row['Data kontaktu']) {
       const cd = new Date(row['Data kontaktu']);
       if (!isNaN(cd.getTime())) contactDate = cd;
    }

    let createdAt = new Date();
    if (row['Data dodania']) {
       const ca = new Date(row['Data dodania']);
       if (!isNaN(ca.getTime())) createdAt = ca;
    }

    try {
      await db.insert(leads).values({
        firstName,
        lastName,
        email,
        phone,
        status: status as any,
        source,
        notes,
        contactDate,
        assignedToId: assignedToId || null,
        createdById: createdById || admin.id,
        createdAt
      });
      successCount++;
    } catch (e) {
      console.log(`Pominieto leada ${firstName} ${lastName}: błąd dodawania do bazy`);
    }
  }

  console.log(`Gotowe! Pomyślnie zaimportowano ${successCount} leadów.`);
  process.exit(0);
}

seed().catch(err => {
  console.error('Błąd podczas importu:', err);
  process.exit(1);
});
