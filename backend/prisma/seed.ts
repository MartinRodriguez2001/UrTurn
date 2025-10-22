import { PrismaClient } from '../generated/prisma/index.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de base de datos...');

  // Crear usuario de prueba
  const hashedPassword = await bcrypt.hash('password123', 10);

  const testUser = await prisma.user.upsert({
    where: { institutional_email: 'test@uc.cl' },
    update: {},
    create: {
      name: 'Usuario Test',
      institutional_email: 'test@uc.cl',
      password_hash: hashedPassword,
      institution_credential: 'https://example.com/credential.pdf',
      student_certificate: 'https://example.com/certificate.pdf',
      IsDriver: false,
      phone_number: '+56912345678',
      active: true,
      profile_picture: 'https://ui-avatars.com/api/?name=Test+User',
      description: 'Usuario de prueba para testing',
    },
  });

  console.log('✅ Usuario de prueba creado:');
  console.log('   Email: test@uc.cl');
  console.log('   Password: password123');
  console.log('   ID:', testUser.id);

  // Crear conductor de prueba
  const testDriver = await prisma.user.upsert({
    where: { institutional_email: 'driver@uc.cl' },
    update: {},
    create: {
      name: 'Conductor Test',
      institutional_email: 'driver@uc.cl',
      password_hash: hashedPassword,
      institution_credential: 'https://example.com/credential.pdf',
      student_certificate: 'https://example.com/certificate.pdf',
      IsDriver: true,
      phone_number: '+56987654321',
      active: true,
      profile_picture: 'https://ui-avatars.com/api/?name=Driver+Test',
      description: 'Conductor de prueba para testing',
    },
  });

  console.log('\n✅ Conductor de prueba creado:');
  console.log('   Email: driver@uc.cl');
  console.log('   Password: password123');
  console.log('   ID:', testDriver.id);

  console.log('\n🎉 Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
