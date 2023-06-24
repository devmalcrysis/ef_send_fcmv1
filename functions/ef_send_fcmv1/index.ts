// curl --location 'http://localhost:8000/functions/v1/' \
// --header 'Content-Type: application/json' \
// --data '{
//     "type": "INSERT",
//     "table": "mensajes_push",
//     "record": {
//         "uuid": "no-relevante",
//         "imagen": "opcional http://image_url",
//         "nombre": "titulo de la notificacion",
//         "mensaje": "texto de la notificacion",
//         "created_at": "2023-06-18T20:27:11.598693+00:00",
//         "id_dispositivo": [
//             "id del dispositivo al que se enviará la notificacion"
//         ]
//     },
//     "schema": "public",
//     "old_record": null
// }'


import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
//import GoogleAuth from "npm:google-auth-library@8.8.0";
// import GoogleAuth from "https://esm.sh/google-auth-library@8.8.0";
import {
  getToken,
  GoogleAuth,
} from "https://deno.land/x/googlejwtsa@v0.1.8/mod.ts";


serve(async (req) => {
  console.info('Variable0 -> : ', Deno.env.get('key1'));
  Deno.env.set("key1","valor1");
  console.info('Variable1 -> : ', Deno.env.get('key1'));
  console.info('Variable2 -> : ', Deno.env.get('GoogleCredentials'));

  const fcmUrl =
    "https://fcm.googleapis.com/v1/projects/portaladopcion/messages:send";

  const body = await req.text(); // Read the entire body as text

  //Ver comentario en la función definida al final
  // const jwt = await getAccessToken();

  //Para usar esta variable de entorno, setear el valor al contenido a un
  //JSON ServiceAccount https://console.firebase.google.com/project/portaladopcion/settings/serviceaccounts/adminsdk?hl=es
  //para setear valor puede usarse un archivo que tenga Clave={contenidoJson}
  //npx supabase secrets set --env-file C:\rutadelproyecto\.env
  //Para debuguear sin haber definido variables de entorno localmente, 
  //descomentar la lectura de archivo un poco mas abajo
  const googleServiceAccountCredentials = Deno.env.get('GoogleCredentials') || '';

  // En caso que no quieras setear variables de entorno localmente, puedes 
  // leer las credenciales de google directamente desde el archivo
  // const googleServiceAccountCredentials = await Deno.readTextFile(
  //   "service-account.json",
  // );

  const googleAuthOptions = {
    scope: ["https://www.googleapis.com/auth/firebase.messaging"], // Pueden definirse más scopes, este es el necesario para FCM
  };

  const jwt: GoogleAuth = await getToken(
    googleServiceAccountCredentials,
    googleAuthOptions,
  );

  console.log("JWT:", jwt);

  let nombre, imagen, mensaje, id_dispositivo;
  try {
    const json = JSON.parse(body);
    nombre = json.record.nombre;
    mensaje = json.record.mensaje;
    imagen = json.record.imagen;
    id_dispositivo = json.record.id_dispositivo[0];
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return new Response("JSON de entrada inválido", { status: 400 });
  }

  const payload = {
    message: {
      token: id_dispositivo,
      notification: {
        title: nombre,
        body: mensaje,
        image: imagen,
      },
    },
  };

  // Make the POST request to FCM
  const response = await fetch(fcmUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${jwt.access_token}`,
    },
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    const data = await response.json();
    console.log("Respuesta FCM:", data);
    return new Response(
      JSON.stringify(data),
      { headers: { "Content-Type": "application/json" } },
    );
  } else {
    // Request failed, handle accordingly
    console.error("Error enviando mensaje FCM:", response.statusText);
    const data = {
      message: `No se pudo enviar la notificación`,
    };
    return new Response(
      JSON.stringify(data),
      { status: 409, headers: { "Content-Type": "application/json" } },
    );
  }
});


// async function getAccessToken() {
//   //Si se usa el import "npm:google-auth-library@8.8.0" esto funcionará en local
//   //pero actualmente no puede ser desplegado en el servidor de Supabase por limitaciones
//   //con los paquetes npm. Lo dejo solo a modo de referencia
//
//   // Si se quiere usar las credenciales de servicio en formato json....
//   // const keyFile = "service-account.json";
//   // const auth = new GoogleAuth.GoogleAuth({
//   //   keyFile: keyFile,
//   //   scopes: "https://www.googleapis.com/auth/firebase.messaging",
//   // });
//
//   //Pero también se pueden pasar las credenciales en un objeto credentials
//   const auth = new GoogleAuth({
//     credentials: {
//       "client_email":
//         "firebase-xxxx3@sssss.iam.gserviceaccount.com",
//       "private_key":
//         "-----BEGIN PRIVATE KEY-----\nMIIEv...kVqikfc=\n-----END PRIVATE KEY-----\n",
//     },
//     scopes: "https://www.googleapis.com/auth/firebase.messaging",
//   });

//   const client = await auth.getClient();
//   const token = await client.getAccessToken();
//   return token.token;
// }
