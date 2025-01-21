import { mockData } from '../utils/data.js';
import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generateMockData() {
  // Convert the mock data to JSON
  const jsonData = JSON.stringify(mockData, null, 2);

  // Write to mockData.json
  await writeFile(join(__dirname, '../utils/mockData.json'), jsonData);
  console.log('Mock data has been written to utils/mockData.json');
}

generateMockData().catch(console.error); 