import { mkdirSync, writeFileSync } from 'node:fs';

const preview = {
  currentSeason: { slug: 'spring-2026', name: 'Весенний мемомес 2026' },
  note: 'This lightweight seed writes a preview artifact. Replace with Prisma createMany calls after installing dependencies.',
};

mkdirSync('samples/generated', { recursive: true });
writeFileSync('samples/generated/seed-preview.json', JSON.stringify(preview, null, 2));
console.log('Seed preview generated at samples/generated/seed-preview.json');
