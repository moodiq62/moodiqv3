const { Router } = require('express');
const router = Router();
const admin = require('firebase-admin');
const Handlebars = require('handlebars');
const nodeMailer = require('nodemailer');

var serviceAccount = require("../../moodiqv3-firebase-adminsdk-n8s2r-b9c11647c3.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://moodiqv3-default-rtdb.firebaseio.com/'
});

Handlebars.registerHelper('ifEqual', function(arg1, arg2, options) {
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

const db = admin.database();

const auth = admin.auth();

router.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Utiliza el método createUserWithEmailAndPassword de auth para crear un usuario
    const userRecord = await auth.createUser({
      email: email, 
      password: password 
    });

    // Aquí puedes realizar acciones adicionales después de crear el usuario, si es necesario.
    // Por ejemplo, puedes escribir los datos del usuario en la base de datos 'users'
    await db.ref('users').push({
      email: email,
      password: password // En una aplicación real, deberías cifrar la contraseña antes de almacenarla
    });

    res.status(201).redirect('/');
  } catch (error) {
    console.error('Error al crear el usuario:', error.message);
    res.status(500).redirect('/');
  }
});


router.post('/signin', async (req, res) => {
  const { email_signin, password_signin } = req.body;

  try {
    const snapshot = await db.ref('users').orderByChild('email').equalTo(email_signin).once('value');
    const userData = snapshot.val();

    if (!userData) {
      throw new Error('Usuario no encontrado');
    }

    const userId = Object.keys(userData)[0];
    const user = userData[userId];

    if (user.password !== password_signin) {
      throw new Error('Contraseña incorrecta');
    }
    res.status(200).redirect('/dashboardStress'); // Redirecciona a la página principal después de un inicio de sesión exitoso
  } catch (error) {
    console.error('Error al iniciar sesión:', error.message);
    res.status(401).redirect('/'); // Envía un código de estado 401 si hay un error durante el inicio de sesión
  }
});





//login
router.get('/', (req, res) => {
  // Obtener la fecha actual
  const today = new Date();
  // Calcular el primer día de la semana restando los días transcurridos desde el domingo
  const firstDayOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
  // Calcular el último día de la semana sumando los días restantes de la semana
  const lastDayOfWeek = new Date(firstDayOfWeek);
  lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);

  // Convertir las fechas a formato ISO
  const startDate = firstDayOfWeek.toISOString().split('T')[0];
  const endDate = lastDayOfWeek.toISOString().split('T')[0];

  // Realizar la consulta a la base de datos Firebase con el filtro de fecha
  db.ref('averages').orderByChild('fecha').startAt(startDate).endAt(endDate).once('value', (snapshot) => {
    const data = snapshot.val();

    // Inicializar contadores generales y por departamento para cada tipo de emoji
    let countsGenerales = { felizCount: 0, neutralCount: 0, enojadoCount: 0 };
    let countsPorDepartamento = {
      Direccion: { felizCount: 0, neutralCount: 0, enojadoCount: 0 },
      Digitalizacion: { felizCount: 0, neutralCount: 0, enojadoCount: 0 },
      RecursosHumanos: { felizCount: 0, neutralCount: 0, enojadoCount: 0 },
      FES: { felizCount: 0, neutralCount: 0, enojadoCount: 0 },
      HSE: { felizCount: 0, neutralCount: 0, enojadoCount: 0 },
      Industrializacion: { felizCount: 0, neutralCount: 0, enojadoCount: 0 },
      Manufactura: { felizCount: 0, neutralCount: 0, enojadoCount: 0 },
      Mantenimiento1: { felizCount: 0, neutralCount: 0, enojadoCount: 0 },
      Mantenimiento2: { felizCount: 0, neutralCount: 0, enojadoCount: 0 },
      Mantenimiento3: { felizCount: 0, neutralCount: 0, enojadoCount: 0 },
      ShopFlow: { felizCount: 0, neutralCount: 0, enojadoCount: 0 },
      PM: { felizCount: 0, neutralCount: 0, enojadoCount: 0 },
      TI: { felizCount: 0, neutralCount: 0, enojadoCount: 0 },
    };

    // Iterar sobre los datos y contar los emojis generales y por departamento
    if (data) {
      Object.values(data).forEach(entry => {
        const departamento = entry.department;
        const emoji = entry.emoji;

        // Conteo general
        switch (emoji) {
          case "😄":
            countsGenerales.felizCount++;
            break;
          case "😐":
            countsGenerales.neutralCount++;
            break;
          case "😠":
            countsGenerales.enojadoCount++;
            break;
          default:
            // Otro emoji o ningún emoji reconocido
            break;
        }

        // Conteo por departamento
        if (departamento in countsPorDepartamento) {
          switch (emoji) {
            case "😄":
              countsPorDepartamento[departamento].felizCount++;
              break;
            case "😐":
              countsPorDepartamento[departamento].neutralCount++;
              break;
            case "😠":
              countsPorDepartamento[departamento].enojadoCount++;
              break;
            default:
              // Otro emoji o ningún emoji reconocido
              break;
          }
        }
      });
    }

    // Renderizar la vista 'dashboardAverage' con los datos y los contadores generales y por departamento
    res.render('login', { averages: data, countsGenerales, countsPorDepartamento });
  });
});
//login

router.get('/dashboardAverage', (req, res) => {
  const fechaActual = new Date().toISOString().split('T')[0];

  // Realizamos la consulta a la base de datos Firebase con el filtro de fecha
  db.ref('averages').orderByChild('fecha').equalTo(fechaActual).once('value', (snapshot) => {
    const data = snapshot.val();

    // Inicializamos contadores generales y por departamento para cada tipo de emoji
    let countsGenerales = { felizCount: 0, neutralCount: 0, enojadoCount: 0 };
    let countsPorDepartamento = {
      Direccion: { felizCount: 0, neutralCount: 0, enojadoCount: 0 },
      Digitalizacion: { felizCount: 0, neutralCount: 0, enojadoCount: 0 },
      RecursosHumanos: { felizCount: 0, neutralCount: 0, enojadoCount: 0 },
      FES: { felizCount: 0, neutralCount: 0, enojadoCount: 0 },
      HSE: { felizCount: 0, neutralCount: 0, enojadoCount: 0 },
      Industrializacion: { felizCount: 0, neutralCount: 0, enojadoCount: 0 },
      Manufactura: { felizCount: 0, neutralCount: 0, enojadoCount: 0 },
      Mantenimiento1: { felizCount: 0, neutralCount: 0, enojadoCount: 0 },
      Mantenimiento2: { felizCount: 0, neutralCount: 0, enojadoCount: 0 },
      Mantenimiento3: { felizCount: 0, neutralCount: 0, enojadoCount: 0 },
      pcAndL: { felizCount: 0, neutralCount: 0, enojadoCount: 0 },
      PM: { felizCount: 0, neutralCount: 0, enojadoCount: 0 },
      TI: { felizCount: 0, neutralCount: 0, enojadoCount: 0 },
    };

    // Iteramos sobre los datos y contamos los emojis generales y por departamento
    if (data) {
      Object.values(data).forEach(entry => {
        const departamento = entry.department;
        const emoji = entry.emoji;

        // Conteo general
        switch (emoji) {
          case "😄":
            countsGenerales.felizCount++;
            break;
          case "😐":
            countsGenerales.neutralCount++;
            break;
          case "😠":
            countsGenerales.enojadoCount++;
            break;
          default:
            // Otro emoji o ningún emoji reconocido
            break;
        }

        // Conteo por departamento
        if (departamento in countsPorDepartamento) {
          switch (emoji) {
            case "😄":
              countsPorDepartamento[departamento].felizCount++;
              break;
            case "😐":
              countsPorDepartamento[departamento].neutralCount++;
              break;
            case "😠":
              countsPorDepartamento[departamento].enojadoCount++;
              break;
            default:
              // Otro emoji o ningún emoji reconocido
              break;
          }
        }
      });
    }

    // Renderizamos la vista 'dashboardAverage' con los datos y los contadores generales y por departamento
    res.render('dashboardAverage', { averages: data, countsGenerales, countsPorDepartamento });
  });
});

router.get('/dashboardArea', (req, res) => {
  // Obtener la fecha actual
  const today = new Date();
  // Calcular el primer día de la semana restando los días transcurridos desde el domingo
  const firstDayOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
  // Calcular el último día de la semana sumando los días restantes de la semana
  const lastDayOfWeek = new Date(firstDayOfWeek);
  lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);

  // Convertir las fechas a formato ISO
  const startDate = firstDayOfWeek.toISOString().split('T')[0];
  const endDate = lastDayOfWeek.toISOString().split('T')[0];

  // Realizar la consulta a la base de datos Firebase con el filtro de fecha
  db.ref('averages').orderByChild('fecha').startAt(startDate).endAt(endDate).once('value', (snapshot) => {
    const data = snapshot.val();

    // Inicializar contadores generales y por departamento para cada tipo de imagen
    let countsGenerales = { goodCount: 0, mediumCount: 0, highCount: 0 };
    let countsPorDepartamento = {
      Direccion: { goodCount: 0, mediumCount: 0, highCount: 0 },
      Digitalizacion: { goodCount: 0, mediumCount: 0, highCount: 0 },
      RecursosHumanos: { goodCount: 0, mediumCount: 0, highCount: 0 },
      FES: { goodCount: 0, mediumCount: 0, highCount: 0 },
      HSE: { goodCount: 0, mediumCount: 0, highCount: 0 },
      Industrializacion: { goodCount: 0, mediumCount: 0, highCount: 0 },
      Manufactura: { goodCount: 0, mediumCount: 0, highCount: 0 },
      Mantenimiento1: { goodCount: 0, mediumCount: 0, highCount: 0 },
      Mantenimiento2: { goodCount: 0, mediumCount: 0, highCount: 0 },
      Mantenimiento3: { goodCount: 0, mediumCount: 0, highCount: 0 },
      pcAndL: { goodCount: 0, mediumCount: 0, highCount: 0 },
      PM: { goodCount: 0, mediumCount: 0, highCount: 0 },
      TI: { goodCount: 0, mediumCount: 0, highCount: 0 },
    };

    // Iterar sobre los datos y contar las imágenes generales y por departamento
    if (data) {
      Object.values(data).forEach(entry => {
        const departamento = entry.department;
        const image = entry.image;

        // Conteo general
        switch (image) {
          case "https://firebasestorage.googleapis.com/v0/b/moodiq-2d5d4.appspot.com/o/Diapositiva3.PNG?alt=media&token=24b06829-0872-4cbb-a377-bead115ec430":
            countsGenerales.goodCount++;
            break;
          case "https://firebasestorage.googleapis.com/v0/b/moodiq-2d5d4.appspot.com/o/Diapositiva2.PNG?alt=media&token=3d0283b7-6c5e-4a0d-9b88-fb46dacde1c5":
            countsGenerales.mediumCount++;
            break;
          case "https://firebasestorage.googleapis.com/v0/b/moodiq-2d5d4.appspot.com/o/Diapositiva1.PNG?alt=media&token=70a533ae-1bbc-4e04-a5eb-9e1839019de1":
            countsGenerales.highCount++;
            break;
          default:
            // Otro emoji o ninguna imagen reconocida
            break;
        }

        // Conteo por departamento
        if (departamento in countsPorDepartamento) {
          switch (image) {
            case "https://firebasestorage.googleapis.com/v0/b/moodiq-2d5d4.appspot.com/o/Diapositiva3.PNG?alt=media&token=24b06829-0872-4cbb-a377-bead115ec430":
              countsPorDepartamento[departamento].goodCount++;
              break;
            case "https://firebasestorage.googleapis.com/v0/b/moodiq-2d5d4.appspot.com/o/Diapositiva2.PNG?alt=media&token=3d0283b7-6c5e-4a0d-9b88-fb46dacde1c5":
              countsPorDepartamento[departamento].mediumCount++;
              break;
            case "https://firebasestorage.googleapis.com/v0/b/moodiq-2d5d4.appspot.com/o/Diapositiva1.PNG?alt=media&token=70a533ae-1bbc-4e04-a5eb-9e1839019de1":
              countsPorDepartamento[departamento].highCount++;
              break;
            default:
              // Otro emoji o ninguna imagen reconocida
              break;
          }
        }
      });
    }

    // Renderizar la vista 'dashboardArea' con los datos y los contadores generales y por departamento
    res.render('dashboardArea', { averages: data, countsGenerales, countsPorDepartamento, showNavbar: true });
  });
});

router.get('/delete-average/:id',(req, res)=>{
  db.ref('averages/' + req.params.id).remove();
  res.redirect('/dashboardAverage');
});

router.post('/grade',(req, res) => {
  console.log(req.body);
  const average = {
    firstname: req.body.firstname,
    department: req.body.department,
    emoji: req.body.emoji,
    fecha: req.body.fecha,
    stress: req.body.stress,
    image : req.body.image,
    area : req.body.area
  };
  db.ref('averages').push(average);
  res.redirect('/dashboardAverage');
});

router.get('/dashboardStress', (req, res) => {
  // Obtener la fecha actual
  const today = new Date();
  // Calcular el primer día de la semana restando los días transcurridos desde el domingo
  const firstDayOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
  // Calcular el último día de la semana sumando los días restantes de la semana
  const lastDayOfWeek = new Date(firstDayOfWeek);
  lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);

  // Convertir las fechas a formato ISO
  const startDate = firstDayOfWeek.toISOString().split('T')[0];
  const endDate = lastDayOfWeek.toISOString().split('T')[0];

  // Realizar la consulta a la base de datos Firebase
  db.ref('averages').orderByChild('fecha').startAt(startDate).endAt(endDate).once('value', (snapshot) => {
    const data = snapshot.val();

    // Filtrar por firstname si se proporciona en la solicitud
    const firstname = req.query.firstname;
    let filteredData = data;

    if (firstname) {
      filteredData = Object.values(data).filter(item => item.firstname === firstname);
    }

    res.render('dashboardStress', { averages: filteredData , showNavbar: true });
  });
});

router.get('/form',(req, res) => {
  db.ref('averages').once('value', (snapshot) => {
    const data = snapshot.val();
    res.render('form', {contacts: data});
  });
});

router.get('/formSalud',(req, res) => {
  db.ref('areas').once('value', (snapshot) => {
    const data = snapshot.val();
    res.render('formSalud', {contacts: data});
  });
});

module.exports = router;

const today = new Date();

if (today.getDay() === 5) {
const transporter = nodeMailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
      user: "angel79ro34@gmail.com",
      pass: "gpty bldh orxo zdlo"
  }
});

const today = new Date();
// Calcular el primer día de la semana restando los días transcurridos desde el domingo
const firstDayOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
// Calcular el último día de la semana sumando los días restantes de la semana
const lastDayOfWeek = new Date(firstDayOfWeek);
lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);

// Convertir las fechas a formato ISO
const startDate = firstDayOfWeek.toISOString().split('T')[0];
const endDate = lastDayOfWeek.toISOString().split('T')[0];

// Realizar la consulta a la base de datos Firebase con el filtro de fecha
db.ref('averages').orderByChild('fecha').startAt(startDate).endAt(endDate).once('value', (snapshot) => {
const data = snapshot.val();

// Inicializar contadores generales y por departamento para cada tipo de emoji
let countsGenerales = { felizCount: 0, neutralCount: 0, enojadoCount: 0, goodCount: 0, mediumCount: 0, highCount: 0 };
let countsPorDepartamento = {
  Direccion: { felizCount: 0, neutralCount: 0, enojadoCount: 0 },
  Digitalizacion: { felizCount: 0, neutralCount: 0, enojadoCount: 0 },
  RecursosHumanos: { felizCount: 0, neutralCount: 0, enojadoCount: 0 },
  FES: { felizCount: 0, neutralCount: 0, enojadoCount: 0 },
  HSE: { felizCount: 0, neutralCount: 0, enojadoCount: 0 },
  Industrializacion: { felizCount: 0, neutralCount: 0, enojadoCount: 0 },
  Manufactura: { felizCount: 0, neutralCount: 0, enojadoCount: 0 },
  Mantenimiento1: { felizCount: 0, neutralCount: 0, enojadoCount: 0 },
  Mantenimiento2: { felizCount: 0, neutralCount: 0, enojadoCount: 0 },
  Mantenimiento3: { felizCount: 0, neutralCount: 0, enojadoCount: 0 },
  pcAndL: { felizCount: 0, neutralCount: 0, enojadoCount: 0 },
  PM: { felizCount: 0, neutralCount: 0, enojadoCount: 0 },
  TI: { felizCount: 0, neutralCount: 0, enojadoCount: 0 },
};

// Iterar sobre los datos y contar los emojis generales y por departamento
if (data) {
  Object.values(data).forEach(entry => {
    const departamento = entry.department;
    const emoji = entry.emoji;

    // Conteo general
    switch (emoji) {
      case "😄":
        countsGenerales.felizCount++;
        break;
      case "😐":
        countsGenerales.neutralCount++;
        break;
      case "😠":
        countsGenerales.enojadoCount++;
        break;
      default:
        // Otro emoji o ningún emoji reconocido
        break;
    }
  });

  // Iterar sobre los datos y contar las imágenes generales y por departamento
  Object.values(data).forEach(entry => {
    const countsPorDepartamento = entry.department;
    const image = entry.image;

    // Conteo general
    switch (image) {
      case "https://firebasestorage.googleapis.com/v0/b/moodiq-2d5d4.appspot.com/o/Diapositiva3.PNG?alt=media&token=24b06829-0872-4cbb-a377-bead115ec430":
        countsGenerales.goodCount++;
        break;
      case "https://firebasestorage.googleapis.com/v0/b/moodiq-2d5d4.appspot.com/o/Diapositiva2.PNG?alt=media&token=3d0283b7-6c5e-4a0d-9b88-fb46dacde1c5":
        countsGenerales.mediumCount++;
        break;
      case "https://firebasestorage.googleapis.com/v0/b/moodiq-2d5d4.appspot.com/o/Diapositiva1.PNG?alt=media&token=70a533ae-1bbc-4e04-a5eb-9e1839019de1":
        countsGenerales.highCount++;
        break;
      default:
        // Otro emoji o ninguna imagen reconocida
        break;
    }
  });
}

  
function sendEmail(email, countsGenerales, countsPorDepartamento) {
  let mail = {
      from: "angel79ro34@gmail.com",
      to: email,
      subject: "Resumen de recuentos",
      text: "Resumen de recuentos",
      html: `
          <h3>Resumen de recuentos</h3>
          <p><strong>Recuentos generales de la semana:</strong></p>
          <ul>
              <li>Se obtuvo ${countsGenerales.felizCount} emojis felices</li>
              <li>Se obtuvo ${countsGenerales.neutralCount} emojis neutrales</li>
              <li>Se obtuvo ${countsGenerales.enojadoCount} emojis enojados</li>
              <li>Se obtuvo ${countsGenerales.goodCount} en nivel de estres bajo: </li>
              <li>Se obtuvo ${countsGenerales.mediumCount} en nivel de estres medio</li>
              <li>Se obtuvo ${countsGenerales.highCount} en nivel de estres alto</li>
          </ul>
      `,
  };

  transporter.sendMail(mail, (error, info) => {
      if (error) {
          console.error("Error al enviar el correo electrónico a", email, ":", error);
      } else {
          console.log("Correo electrónico enviado a", email);
      }
  });
}

// Obtener lista de usuarios registrados en Firebase Authentication
admin
  .auth()
  .listUsers()
  .then((listUsersResult) => {
    listUsersResult.users.forEach((userRecord) => {
      sendEmail(userRecord.email, countsGenerales, countsPorDepartamento);
    });
  })
  .catch((error) => {
    console.error("Error listing users:", error);
  });
});

} else {
  console.log("No se enviará el correo electrónico.");
}
