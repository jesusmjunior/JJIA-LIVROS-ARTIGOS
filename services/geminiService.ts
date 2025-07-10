
import { GoogleGenAI, GroundingChunk, Type } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface GroundedResponse {
    summary: string;
    sources: GroundingChunk[];
}

export const generateGroundedResponse = async (query: string): Promise<GroundedResponse> => {
  const prompt = `Você é um assistente de pesquisa prestativo. Baseado nos resultados de busca, escreva um resumo conciso de um parágrafo respondendo à consulta do usuário: "${query}". Sua resposta deve ser em português. Não liste as fontes na sua resposta, apenas forneça o texto do resumo. Se os resultados forem irrelevantes ou vazios, declare que não conseguiu encontrar informações relevantes.`;

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            tools: [{googleSearch: {}}],
            temperature: 0.1,
        },
    });

    const summary = response.text.trim();
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    return { summary, sources };

  } catch (error) {
    console.error("Error generating grounded response:", error);
    if (error instanceof Error && error.message.includes('SAFETY')) {
        throw new Error("A resposta foi bloqueada devido a políticas de segurança. Por favor, tente uma consulta diferente.");
    }
    throw new Error("Não foi possível processar sua solicitação. Verifique sua consulta ou tente novamente mais tarde.");
  }
};

export const generateCoverImage = async (title: string): Promise<string> => {
    const prompt = `Create a visually striking, photorealistic book cover for a document titled: "${title}". The style should be elegant, classic, and academic. Minimalist design. The cover must not contain any text or letters. Focus on symbolic imagery related to the title.`;
    
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '3:4',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            return response.generatedImages[0].image.imageBytes;
        } else {
            console.warn("Image generation returned no images, returning empty string.");
            return ""; 
        }
    } catch (error) {
        console.error("Error generating cover image:", error);
        return "";
    }
};

interface EnrichedData {
    rating: number;
    tags: string[];
    briefSummary: string;
    publicationYear: number;
    validityRating: string;
}

export const enrichSourceData = async (titles: string[], query: string): Promise<EnrichedData[]> => {
    const currentYear = new Date().getFullYear();
    const prompt = `Para a lista de títulos de documentos a seguir, forneça uma análise detalhada em português para CADA documento com base na consulta do usuário: "${query}". Sua resposta DEVE ser um array JSON onde cada objeto corresponde a um título na mesma ordem. Cada objeto deve ter:
- "rating": um número de 1 a 5 (pode ser float), representando a relevância para a consulta.
- "tags": um array de 3-5 strings curtas de palavras-chave descritivas.
- "briefSummary": uma única frase concisa resumindo o provável conteúdo do documento com base em seu título.
- "publicationYear": um número INTEIRO representando o ano de publicação estimado.
- "validityRating": uma string representando uma classificação de validade no padrão Qualis CAPES (ex: "A1", "A2", "B1", "B2", "C"). Forneça uma classificação alta (A1-B2) apenas se o documento parecer acadêmico e recente (publicado de ${currentYear - 5} a ${currentYear}). Caso contrário, use "C" ou "N/A".

Títulos dos Documentos:
${titles.map((title, index) => `${index + 1}. ${title}`).join('\n')}
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            rating: { type: Type.NUMBER, description: "Pontuação de relevância de 1-5" },
                            tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Tags descritivas" },
                            briefSummary: { type: Type.STRING, description: "Resumo de uma frase" },
                            publicationYear: { type: Type.INTEGER, description: "Ano de publicação estimado" },
                            validityRating: { type: Type.STRING, description: "Classificação de validade (padrão Qualis)" },
                        },
                        required: ["rating", "tags", "briefSummary", "publicationYear", "validityRating"],
                    },
                },
            },
        });

        return JSON.parse(response.text);

    } catch (error) {
        console.error("Error enriching source data:", error);
        // Return a fallback array of the correct length to prevent app crash
        return titles.map(() => ({
            rating: 0,
            tags: ['Análise Falhou'],
            briefSummary: 'Não foi possível gerar o resumo.',
            publicationYear: 0,
            validityRating: 'N/A',
        }));
    }
};

export const generateCorrelationMap = async (results: {title: string}[]) => {
    const prompt = `Analise a seguinte lista de documentos de pesquisa. Agrupe-os em 2-4 clusters temáticos com base em seus títulos. Para cada cluster, forneça um título de "theme" e uma breve "description" explicando a conexão. A resposta deve ser em português. Estruture sua resposta como um objeto JSON com uma chave "clusters". "clusters" é um array de objetos, onde cada objeto tem "theme", "description" e "nodes". "nodes" é um array de objetos com "resultIndex" (o índice original baseado em 0) e "title".

Documentos:
${results.map((r, i) => `${i}: ${r.title}`).join('\n')}
`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        clusters: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    theme: { type: Type.STRING },
                                    description: { type: Type.STRING },
                                    nodes: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                resultIndex: { type: Type.INTEGER },
                                                title: { type: Type.STRING },
                                            },
                                            required: ["resultIndex", "title"],
                                        },
                                    },
                                },
                                required: ["theme", "description", "nodes"],
                            },
                        },
                    },
                    required: ["clusters"],
                },
            },
        });
        return JSON.parse(response.text);
    } catch(error) {
        console.error("Error generating correlation map:", error);
        return null;
    }
};

export const generateScientificArticle = async (selectedWorks: { title: string, url: string }[]): Promise<string> => {
    const worksList = selectedWorks.map(work => `- Título: ${work.title}\n  - URL: ${work.url}`).join('\n');

    const prompt = `
Você é um assistente de redação acadêmica especialista em normas da ABNT.
Sua tarefa é escrever um artigo científico conciso em português, baseado na lista de obras fornecida.

O artigo deve seguir esta estrutura:
1.  **Introdução:** Apresente o tema central que conecta as obras e o objetivo do artigo.
2.  **Desenvolvimento:** Discuta e sintetize as ideias principais das obras, conectando-as de forma coerente. Cite as obras ao longo do texto quando apropriado (pode usar o formato autor-data de forma simplificada, inferindo o autor a partir do título se necessário).
3.  **Conclusão:** Apresente uma síntese final das ideias discutidas e possíveis direções para futuras pesquisas.
4.  **Referências:** Liste TODAS as obras fornecidas em uma seção final. Esta seção é a mais importante. Formate cada entrada **ESTRITAMENTE** de acordo com as normas da ABNT para artigos, livros e fontes da internet.

**Formato da Resposta:**
A resposta DEVE ser um documento HTML. Use tags HTML semânticas (\`<h1>\`, \`<h2>\`, \`<h3>\`, \`<p>\`, \`<ul>\`, \`<li>\`, etc.). Não inclua \`<html>\`, \`<head>\` ou \`<body>\` tags, apenas o conteúdo do corpo do artigo. O título principal do artigo deve ser um \`<h1>\`. Os títulos das seções (Introdução, Desenvolvimento, etc.) devem ser \`<h2>\`. A lista de referências deve ser uma lista não ordenada (\`<ul>\` e \`<li>\`).

**Obras Selecionadas:**
${worksList}

Comece a escrever o artigo agora.
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 0.5,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error generating scientific article:", error);
        if (error instanceof Error && error.message.includes('SAFETY')) {
            return "<h1>Erro de Segurança</h1><p>O conteúdo solicitado não pôde ser gerado devido às políticas de segurança. Por favor, tente com uma seleção diferente de obras.</p>";
        }
        return "<h1>Erro na Geração</h1><p>Não foi possível gerar o artigo. Por favor, tente novamente mais tarde.</p>";
    }
};
