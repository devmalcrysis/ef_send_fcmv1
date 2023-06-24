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
console.log("Hello from Functions!");
serve(async (req)=>{
    const fcmUrl = "https://fcm.googleapis.com/fcm/send";
    const fcmApiKey = "TU_CLAVE_API_DE_SERVIDOR";
    const body = await req.text(); // Read the entire body as text
    console.log("Received body:", body); // Print the received body to the console
    let nombre, imagen, mensaje, id_dispositivo;
    try {
        const json = JSON.parse(body);
        nombre = json.record.nombre;
        mensaje = json.record.mensaje;
        imagen = json.record.imagen;
        id_dispositivo = json.record.id_dispositivo[0];
    } catch (error) {
        console.error("Error parsing JSON:", error);
        // Handle the error if the body is not valid JSON
        return new Response("Invalid JSON body", {
            status: 400
        });
    }
    const payload = {
        to: id_dispositivo,
        notification: {
            title: nombre,
            body: mensaje,
            subtitle: "Esto es un subtítulo"
        }
    };
    // Make the POST request to FCM
    const response = await fetch(fcmUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `key=${fcmApiKey}`
        },
        body: JSON.stringify(payload)
    });
    // Handle the response
    if (response.ok) {
        // Request successful, handle accordingly
        const data = await response.json();
        console.log("FCM response:", data);
        return new Response(JSON.stringify(data), {
            headers: {
                "Content-Type": "application/json"
            }
        });
    } else {
        // Request failed, handle accordingly
        console.error("Failed to send FCM message:", response.statusText);
        const data = {
            message: `No se pudo enviar la notificación`
        };
        return new Response(JSON.stringify(data), {
            status: 409,
            headers: {
                "Content-Type": "application/json"
            }
        });
    }
    console.log("Entrando!");
    const data = {
        message: `Hello`
    };
    console.log("Saliendo!");
    return new Response(JSON.stringify(data), {
        headers: {
            "Content-Type": "application/json"
        }
    });
});
