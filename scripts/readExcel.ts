import { readFile } from 'node:fs/promises';
import { read, utils } from 'xlsx';

async function run() {
  const buf = await readFile('leady-flow-crm.xlsx');
  const workbook = read(buf);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = utils.sheet_to_json(worksheet, { header: 1 }).slice(0, 5);
  console.log(JSON.stringify(data, null, 2));
}

run();
