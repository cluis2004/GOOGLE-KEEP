const http = require('http');

const users = [
  { name: 'Dueño', email: 'dueno@gmail.com', password: '123123123' },
  { name: 'Editor', email: 'editor@gmail.com', password: '123123123' },
  { name: 'Lector', email: 'lector@gmail.com', password: '123123123' }
];

function createUser(user) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(user);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/usuariocontroller/save',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ Usuario creado: ${user.name} (${user.email})`);
          resolve();
        } else {
          if (body.includes('ya está registrado')) {
             console.log(`⚠️  El usuario ya existe: ${user.name} (${user.email})`);
             resolve();
          } else {
             console.error(`❌ Error al crear ${user.name}: ${body}`);
             resolve();
          }
        }
      });
    });

    req.on('error', (e) => {
      console.error(`❌ Error de conexión: No se pudo contactar al backend. Asegúrate de que el backend esté corriendo en el puerto 3000.`);
      reject(e);
    });

    req.write(data);
    req.end();
  });
}

async function seed() {
  console.log('--- Iniciando creación de usuarios de prueba ---');
  try {
      for (const user of users) {
        await createUser(user);
      }
      console.log('--- Proceso completado ---');
      console.log('\nPuedes iniciar sesión con las siguientes credenciales:');
      console.log('  - dueno@gmail.com   / 123123123');
      console.log('  - editor@gmail.com  / 123123123');
      console.log('  - lector@gmail.com  / 123123123');
  } catch (err) {
      console.log('Proceso abortado por error de conexión.');
  }
}

seed();
