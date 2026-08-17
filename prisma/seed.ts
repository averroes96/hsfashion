import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://admin:password@localhost:5432/hsfashion?schema=public' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const generateSlug = (name: string) => {
  return name.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

const families = [
  // Chaussures (Shoes)
  { name: 'Baskets', arabicName: 'أحذية رياضية', description: 'Chaussures de sport et décontractées' },
  { name: 'Bottes', arabicName: 'أحذية برقبة / بوت', description: 'Bottes et bottines' },
  { name: 'Mocassins', arabicName: 'أحذية بدون كعب / لوفر', description: 'Chaussures de ville sans lacets' },
  { name: 'Richelieus', arabicName: 'أحذية كلاسيكية / أوكسفورد', description: 'Chaussures classiques à lacets' },
  { name: 'Sandales', arabicName: 'صنادل', description: 'Chaussures ouvertes d\'été' },
  { name: 'Talons', arabicName: 'أحذية بكعب', description: 'Chaussures à talons hauts' },
  { name: 'Chaussures Plates', arabicName: 'أحذية مسطحة', description: 'Ballerines et chaussures sans talon' },
  { name: 'Chaussons', arabicName: 'نعال / شباشب', description: 'Chaussures d\'intérieur' },
  { name: 'Mules', arabicName: 'ميول', description: 'Chaussures ouvertes à l\'arrière' },
  { name: 'Compensées', arabicName: 'أحذية بكعب عريض / ويدجز', description: 'Chaussures à semelle compensée' },
  
  // Sacs (Bags)
  { name: 'Sacs à Main', arabicName: 'حقائب يد', description: 'Sacs classiques à porter à la main' },
  { name: 'Sacs à Dos', arabicName: 'حقائب ظهر', description: 'Sacs pratiques à porter sur le dos' },
  { name: 'Sacs Cabas', arabicName: 'حقائب تسوق / توت', description: 'Grands sacs fourre-tout' },
  { name: 'Sacs Bandoulière', arabicName: 'حقائب كتف', description: 'Sacs à porter en travers du corps' },
  { name: 'Pochettes', arabicName: 'حقائب سهرة / كلاتش', description: 'Petits sacs pour soirées' },
  { name: 'Portefeuilles', arabicName: 'محافظ', description: 'Accessoires pour ranger l\'argent et les cartes' },
];

async function main() {
  console.log(`Start seeding...`);
  
  for (const [index, f] of families.entries()) {
    const slug = generateSlug(f.name);
    
    // We use upsert so it doesn't fail if we run it multiple times
    const family = await prisma.family.upsert({
      where: { slug: slug },
      update: {
        name: f.name,
        arabicName: f.arabicName,
        description: f.description,
        sortOrder: index
      },
      create: {
        name: f.name,
        arabicName: f.arabicName,
        slug: slug,
        description: f.description,
        sortOrder: index
      },
    });
    console.log(`Upserted family: ${family.name}`);
  }
  
  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
