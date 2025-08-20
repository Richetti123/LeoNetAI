import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtiene la ruta al directorio actual para encontrar el archivo de configuración.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.resolve(__dirname, '..', 'src', 'configbot.json');

/**
 * Función principal para manejar los comandos de gestión de servicios.
 * @param {import('@whiskeysockets/baileys').WAMessage} m El objeto de mensaje entrante.
 * @param {import('../lib/simple.js').smsg} smsg La función simplificada de manejo de mensajes.
 * @param {boolean} isOwner Indica si el remitente es el propietario del bot.
 * @param {string} budy El cuerpo del mensaje.
 */
export async function handler(m, smsg, isOwner, budy) {
    if (!isOwner) {
        // Solo el propietario puede ejecutar estos comandos.
        return m.reply('❌ Lo siento, este comando solo puede ser utilizado por el propietario del bot.');
    }

    try {
        // Leemos el archivo de configuración actual
        const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        // Comando para añadir un nuevo servicio
        if (budy.startsWith('!addservice ')) {
            const args = budy.substring('!addservice '.length).split('|').map(arg => arg.trim());
            
            // Validamos que los argumentos sean los correctos
            if (args.length !== 6) { // Corregido a 6 para incluir la descripcion
                const ejemplo = "!addservice PERFILES TIKTOK|tiktok1|Perfil tiktok Extra|65 MX|10|El plan tiktok te permite tener un perfil seguro y personal con PIN de bloqueo dentro de una cuenta compartida.";
                return m.reply(`❌ Formato incorrecto. Usa: !addservice <categoria>|<id>|<pregunta>|<precio>|<stock>|<descripcion>\n\nEjemplo:\n${ejemplo}`);
            }

            const [categoria, id, pregunta, precio, stock, descripcion] = args;
            const nuevoServicio = { id, pregunta, precio, stock: parseInt(stock, 10), descripcion };

            // Verificamos si la categoría ya existe, si no, la creamos
            if (!configData.services[categoria]) {
                configData.services[categoria] = [];
                await m.reply(`✅ Categoría "${categoria}" creada.`);
            }

            // Verificamos si el ID del servicio ya existe para evitar duplicados
            const serviceExists = configData.services[categoria].some(s => s.id === id);
            if (serviceExists) {
                return m.reply(`❌ El servicio con ID "${id}" ya existe en la categoría "${categoria}".`);
            }
            
            // Añadimos el nuevo servicio a la categoría
            configData.services[categoria].push(nuevoServicio);

            // Escribimos el archivo de configuración actualizado
            fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');

            m.reply(`✅ Servicio "${pregunta}" añadido exitosamente a la categoría "${categoria}".`);
        } 
        
        // Comando para eliminar un servicio
        else if (budy.startsWith('!deleteservice ')) {
            const args = budy.substring('!deleteservice '.length).split('|').map(arg => arg.trim());

            if (args.length !== 2) {
                return m.reply(`❌ Formato incorrecto. Usa: !deleteservice <categoria>|<id>\n\nEjemplo: !deleteservice PERFILES TIKTOK|tiktok1`);
            }

            const [categoria, id] = args;

            // Verificamos si la categoría existe
            if (!configData.services[categoria]) {
                return m.reply(`❌ La categoría "${categoria}" no existe.`);
            }

            // Buscamos el servicio por su ID
            const initialLength = configData.services[categoria].length;
            configData.services[categoria] = configData.services[categoria].filter(s => s.id !== id);

            if (configData.services[categoria].length === initialLength) {
                return m.reply(`❌ No se encontró el servicio con ID "${id}" en la categoría "${categoria}".`);
            }

            // Si la categoría queda vacía, la eliminamos
            if (configData.services[categoria].length === 0) {
                delete configData.services[categoria];
                await m.reply(`✅ La categoría "${categoria}" ha sido eliminada por estar vacía.`);
            }

            // Escribimos el archivo de configuración actualizado
            fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');

            m.reply(`✅ Servicio con ID "${id}" eliminado exitosamente de la categoría "${categoria}".`);
        }

    } catch (e) {
        console.error(`[❗] Error en editarservicio.js: ${e}`);
        m.reply('❌ Lo siento, ocurrió un error al procesar tu solicitud. Por favor, revisa la consola para más detalles.');
    }
}

handler.help = [
    'addservice <categoria>|<id>|<pregunta>|<precio>|<stock>|<descripcion>',
    'deleteservice <categoria>|<id>'
];
handler.tags = ['owner'];
handler.command = /^(addservice|deleteservice)$/i;
