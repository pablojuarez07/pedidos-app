import { Injectable } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class AiService {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY no está definida');
    }

    this.ai = new GoogleGenAI({ apiKey });
  }

  async listarModelos() {
    try {
      const result = await this.ai.models.list();
      const nombresDeModelos: string[] = []; // Definimos el tipo para evitar el error de 'never'

      // Usamos 'for await' porque el Pager de Google es un iterable asíncrono
      for await (const model of result) {
        if (model.name) {
          nombresDeModelos.push(model.name);
        }
      }

      console.log("--- NOMBRES DE MODELOS DISPONIBLES ---");
      console.log(nombresDeModelos);
      
      return nombresDeModelos;
    } catch (error: any) {
      console.error("Error al listar nombres:", error.message);
    }
  }

  async interpretarMensaje(mensaje: string) {
    if (!mensaje) {
      return { error: 'No se recibió ningún mensaje' };
    }

    try {
      const response = await this.ai.models.generateContent({
        model: 'models/gemini-2.5-flash-lite',
        contents: `
          Convertí la siguiente pregunta en un JSON con esta estructura:

          {
            "acciones": [
              {
                "intencion": "",
                "filtros": {
                  "estado": null,
                  "fecha_desde": null,
                  "fecha_hasta": null
                }
              }
            ],
            "respuesta_template": "Texto conversacional usando placeholders"
          }

          Intenciones posibles:
          - listar_pedidos
          - total_gastado
          - cantidad_pedidos

          Estados posibles:
          - pendiente
          - entregado
          - cancelado

          Reglas:
          - En los filtros usar formato YYYY-MM-DD.
          - En la respuesta_template mostrar fechas en formato DD/MM/YY.
          - Nunca usar formato ISO en la respuesta conversacional.
          - Si la pregunta incluye múltiples pedidos de información,
            devolver múltiples acciones.
          - Si el usuario menciona un año específico (ej: 2024),
            usar fecha_desde = 2024-01-01 y fecha_hasta = 2024-12-31.
          - Si menciona "año pasado",
            calcular el año anterior completo.
          - Si menciona un mes específico (ej: enero 2025),
            usar el rango completo de ese mes.
          - Si menciona un rango (ej: del 10 al 20 de marzo),
            calcular ambas fechas exactas.
          - Si no menciona fechas, usar null.
          - Si el usuario pide "mes pasado", calcular las fechas reales del mes anterior.
          - Si pide "este mes", usar el mes actual.
          - Si pide "semana pasada", calcular las fechas reales.
          - Si no menciona fechas, usar null.
          - Si no menciona estado, usar null.
          - Fecha en formato YYYY-MM-DD.
          - Respondé SOLO JSON válido sin texto adicional.
          - NO inventes números.
          - NO inventes resultados.
          - Usá placeholders entre {{ }}.
          - Los placeholders permitidos son:
            {{cantidad_pedidos}}
            {{total_gastado}}
          - Si hay múltiples acciones, combiná todo en una sola frase natural.
          - NO expliques nada fuera del JSON.
          - La respuesta_template debe ser una respuesta afirmativa.
          - Nunca reformules la pregunta.
          - Nunca uses estructura interrogativa.
          - Debe responder directamente al usuario.

          Hoy es ${new Date().toISOString().split('T')[0]}.

          Pregunta: "${mensaje}"
          `
      });
      const texto = response.text?.trim();

      if (!texto) {
        throw new Error("La IA no devolvió contenido");
      }

      const texto_limpio = texto
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      try {
        return JSON.parse(texto_limpio);
      } catch {
        throw new Error("La IA no devolvió JSON válido");
      }
    } catch (error: any) {
      console.error('❌ Error llamando a Gemini:', error);
      throw error;
    }
  }
}