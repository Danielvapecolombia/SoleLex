import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ContractAnalysis } from "../types";

const apiKey = process.env.API_KEY || ''; // Ensure this is set in your environment
const ai = new GoogleGenAI({ apiKey });

// Schema descriptions translated to Spanish to guide the model towards Spanish output
const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "Un resumen ejecutivo conciso del contrato en español." },
    riskScore: { type: Type.NUMBER, description: "Puntaje de riesgo calculado de 0 (seguro) a 100 (alto riesgo) basado en errores, multas severas y discrepancias financieras." },
    spellingErrors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          context: { type: Type.STRING, description: "La palabra o frase con error." },
          suggestion: { type: Type.STRING, description: "La corrección sugerida." }
        }
      }
    },
    deadlines: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING, description: "Fecha en formato ISO 8601 (YYYY-MM-DD)." },
          description: { type: Type.STRING, description: "Descripción en español de lo que debe suceder en esta fecha." },
          type: { type: Type.STRING, enum: ['renewal', 'compliance', 'expiration', 'other'] },
          isOverdue: { type: Type.BOOLEAN, description: "Verdadero si la fecha es anterior a la fecha actual." },
          daysRemaining: { type: Type.NUMBER, description: "Días restantes calculados desde hoy. Negativo si está vencido." }
        }
      }
    },
    financials: {
      type: Type.OBJECT,
      properties: {
        isValid: { type: Type.BOOLEAN, description: "Verdadero SOLO si la suma exacta de los hitos coincide con el Valor Total y los porcentajes son matemáticamente correctos." },
        totalContractValue: { type: Type.NUMBER },
        currency: { type: Type.STRING },
        discrepancies: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Lista detallada de errores matemáticos. Ej: 'La suma de hitos es 900, el total es 1000'." },
        paymentMilestones: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING, description: "Descripción del hito de pago." },
              amount: { type: Type.NUMBER },
              percentage: { type: Type.NUMBER },
              dueDate: { type: Type.STRING }
            }
          }
        }
      }
    },
    complianceAlerts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          severity: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
          type: { type: Type.STRING, enum: ['fine', 'penalty', 'obligation'] },
          description: { type: Type.STRING, description: "Descripción de la multa, penalización o cláusula de cumplimiento." },
          responsibleParty: { type: Type.STRING, enum: ['us', 'counterparty', 'mutual'] }
        }
      }
    }
  },
  required: ["summary", "riskScore", "financials", "deadlines", "complianceAlerts"]
};

export const analyzeContractContent = async (text: string): Promise<ContractAnalysis> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const prompt = `
      Actúa como un Auditor Forense y Abogado Corporativo meticuloso. Tu trabajo es encontrar CADA error en este contrato.
      Fecha Actual: ${today}.
      
      IMPORTANTE: Salida estrictamente en ESPAÑOL.

      INSTRUCCIONES DE ANÁLISIS DETALLADO:

      1. **Auditoría Financiera (PRIORIDAD MÁXIMA)**:
         - Identifica el Valor Total del Contrato.
         - Extrae CADA hito de pago, su monto y su porcentaje.
         - **REALIZA LA SUMA MATEMÁTICA**: Suma todos los montos de los hitos. ¿Es IGUAL al Valor Total?
         - **VERIFICA PORCENTAJES**: Calcula si el monto del hito corresponde realmente al porcentaje declarado del total.
         - Si encuentras CUALQUIER diferencia (incluso mínima), regístralo en 'discrepancies' explicando el error exacto (ej: "El hito 1 dice ser el 20% ($200) pero el 20% del total ($1500) es $300").

      2. **Alertas de Cumplimiento y Multas**:
         - Busca exhaustivamente: Multas por retraso, Cláusulas Penales, Intereses Moratorios y Condiciones Resolutorias.
         - Identifica obligaciones críticas de "Hacer" o "No Hacer" (ej: entregar pólizas, confidencialidad estricta con penalidad).
         - Clasifica quién es el responsable ('us' = nosotros/empresa, 'counterparty' = proveedor/contratista).
         - Queremos saber TODO lo que nos puede costar dinero o riesgo legal si se incumple.

      3. **Ortografía (Filtrado Inteligente)**:
         - REPORTA: Errores ortográficos reales (tildes faltantes, palabras mal escritas como 'hacver', 'conclucion').
         - **IGNORA COMPLETAMENTE**:
           * Palabras con espacios intercalados por justificación (ej: "C o n t r a t o").
           * Errores de espaciado (dobles espacios, falta de espacio tras punto).
           * Saltos de línea extraños o tabulaciones.
           * Nombres propios o términos técnicos en inglés si están bien escritos.
         - El objetivo es limpiar el reporte de ruido de formato.

      4. **Plazos**:
         - Lista todas las fechas límite y su estado actual.

      Texto del Contrato:
      """
      ${text}
      """
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', 
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        thinkingConfig: { thinkingBudget: 2048 } 
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ContractAnalysis;
    }
    throw new Error("No response content");
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

export interface TemplateAnalysis {
  variables: string[];
  normalizedText: string;
}

export const analyzeTemplateVariables = async (text: string): Promise<TemplateAnalysis> => {
  try {
    const prompt = `
      Actúa como un Especialista en Automatización de Documentos Legales.
      
      OBJETIVO:
      Analizar el texto de la plantilla y extraer EXHAUSTIVAMENTE todos los campos variables que deben ser completados.
      
      PATRONES PRIORITARIOS A DETECTAR (Búscalos activamente):
      1. **Marcadores Gráficos y Símbolos**: 
         - [•] (punto pequeño) y [●] (círculo/bullet grande).
         - (*) (asterisco entre paréntesis) o [*].
         - […] (puntos suspensivos).
      2. **Instrucciones de Llenado (con o sin corchetes)**: 
         - Frases como "ingresar fecha", "insertar fecha", "indicar porcentaje", "completar valor".
         - Texto entre corchetes como [indicar], [valor], [completar].
      3. **Zonas de Imagen**: Si el texto dice "FOTO PROYECTO ANEXO", "ESPACIO PARA FOTO", "LOGO AQUÍ", "INSERTAR IMAGEN", o tiene un recuadro de texto indicando una imagen, crea una variable que comience OBLIGATORIAMENTE por "FOTO_".
      4. **Variables Explícitas**: [TIPO_CONTRATO], NIT_CLIENTE, [NOMBRE_REPRESENTANTE].
      5. **Líneas de llenado**: ___________
      
      INSTRUCCIONES DE SALIDA:
      Para cada marcador encontrado:
      - "variable": Crea un nombre de variable único, descriptivo y en ESPAÑOL (ej: "FECHA_DE_FIRMA", "PORCENTAJE_ANTICIPO", "FOTO_EVIDENCIA_1", "DATO_VARIABLE_1").
          * Si detectas que es una imagen, el nombre DEBE empezar con "FOTO_" o "IMG_".
      - "targetSnippet": Copia un fragmento de texto ÚNICO del documento (aprox 40-70 caracteres) que contenga el marcador.
          * IMPORTANTE: Si el marcador es un símbolo común repetido (como "[•]" o "[●]"), el snippet DEBE incluir suficiente texto alrededor para que sea único y distinguible de los otros.
      - "placeholder": El texto exacto del marcador dentro del snippet (ej: "[•]", "[●]", "(*)", "ingresar fecha").

      REGLAS CRÍTICAS:
      - Extrae CADA UNO de los marcadores [•], [●] y (*) como variables independientes. No los agrupes.
      - Si ves "ingresar fecha", esa frase completa es el placeholder.
      - No omitas ningún campo.

      Devuelve un JSON con la lista de "mappings".
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
            { text: prompt },
            { text: `TEMPLATE TEXT START:\n${text.substring(0, 100000)}\nTEMPLATE TEXT END` } 
        ]
      },
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                mappings: { 
                  type: Type.ARRAY, 
                  items: { 
                    type: Type.OBJECT,
                    properties: {
                      variable: { type: Type.STRING },
                      targetSnippet: { type: Type.STRING },
                      placeholder: { type: Type.STRING }
                    },
                    required: ["variable", "targetSnippet", "placeholder"]
                  } 
                }
            }
        }
      }
    });

    if (response.text) {
        const result = JSON.parse(response.text);
        let mappings = result.mappings || [];
        
        // 1. Calcular el índice de aparición para cada mapeo en el texto original.
        mappings = mappings.map((m: any) => ({
            ...m,
            index: text.indexOf(m.targetSnippet)
        }));

        // 2. Ordenar los mapeos por su posición en el documento.
        mappings.sort((a: any, b: any) => {
            if (a.index === -1) return 1;
            if (b.index === -1) return -1;
            return a.index - b.index;
        });

        let normalizedText = text;
        const variablesSet = new Set<string>();
        const variablesList: string[] = [];

        for (const m of mappings) {
            // Generar nombre de variable único si ya existe
            let uniqueVar = m.variable;
            let counter = 2;
            while(variablesSet.has(uniqueVar)) {
                uniqueVar = `${m.variable}_${counter}`;
                counter++;
            }

            variablesSet.add(uniqueVar);
            variablesList.push(uniqueVar);

            // Realizar el reemplazo en el texto usando el snippet único
            if (m.targetSnippet && m.placeholder && normalizedText.includes(m.targetSnippet)) {
                // Reemplazamos el placeholder dentro del snippet por nuestra variable normalizada
                const replacementSnippet = m.targetSnippet.replace(m.placeholder, `[${uniqueVar}]`);
                normalizedText = normalizedText.replace(m.targetSnippet, replacementSnippet);
            }
        }

        return {
          variables: variablesList,
          normalizedText: normalizedText
        };
    }
    throw new Error("No response from template analysis");

  } catch (error) {
      console.error("Template analysis failed:", error);
      throw error;
  }
}