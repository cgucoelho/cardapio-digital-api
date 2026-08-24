import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ImagemLida } from './ler-imagem';

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
// gemini-2.5-flash-image ("nano banana") edita imagem; o -flash simples só
// texto/visão, mais rápido e barato pra descrição. Os dois no tier gratuito.
const MODELO_IMAGEM = 'gemini-2.5-flash-image';
const MODELO_TEXTO = 'gemini-2.5-flash';

interface ParteResposta {
  text?: string;
  inlineData?: { mimeType?: string; data?: string };
}

interface RespostaGemini {
  candidates?: { content?: { parts?: ParteResposta[] } }[];
}

export interface ImagemGerada {
  buffer: Buffer;
  mimetype: string;
}

/** Cliente da Generative Language API (Gemini) — melhoria de foto e descrição de item. */
@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);

  constructor(private readonly config: ConfigService) {}

  async melhorarImagem(imagem: ImagemLida): Promise<ImagemGerada> {
    const prompt =
      'Você é um fotógrafo de produtos para cardápio de cafeteria. Melhore esta foto: ' +
      'iluminação equilibrada, cores fiéis e apetitosas, fundo neutro ou levemente ' +
      'desfocado, foco nítido no alimento ou bebida. Mantenha o mesmo item, mesmo ângulo ' +
      "e enquadramento — não invente elementos novos, não adicione texto nem marca d'água. " +
      'Devolva só a imagem editada.';

    const resposta = await this.chamar(MODELO_IMAGEM, {
      contents: [
        {
          parts: [
            { text: prompt },
            { inlineData: { mimeType: imagem.mimetype, data: imagem.buffer.toString('base64') } },
          ],
        },
      ],
    });

    const parte = resposta.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
    if (!parte?.inlineData?.data) {
      this.logger.warn(`Gemini não devolveu imagem: ${JSON.stringify(resposta).slice(0, 500)}`);
      throw new ServiceUnavailableException(
        'A IA não conseguiu gerar a imagem melhorada. Tente de novo.',
      );
    }

    return {
      buffer: Buffer.from(parte.inlineData.data, 'base64'),
      mimetype: parte.inlineData.mimeType ?? 'image/png',
    };
  }

  async descreverItem(nome: string, imagem: ImagemLida | null): Promise<string> {
    const instrucao =
      'Escreva uma descrição curta (até 160 caracteres), em português do Brasil, apetitosa ' +
      `e objetiva para o item de cardápio "${nome}"` +
      (imagem ? ', baseada na foto enviada' : '') +
      '. Sem emoji, sem aspas, texto corrido, sem repetir o nome do item logo no início.';

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { text: instrucao },
    ];
    if (imagem) {
      parts.push({ inlineData: { mimeType: imagem.mimetype, data: imagem.buffer.toString('base64') } });
    }

    const resposta = await this.chamar(MODELO_TEXTO, { contents: [{ parts }] });
    const texto = resposta.candidates?.[0]?.content?.parts
      ?.map((p) => p.text)
      .filter(Boolean)
      .join(' ')
      .trim();

    if (!texto) {
      this.logger.warn(`Gemini não devolveu texto: ${JSON.stringify(resposta).slice(0, 500)}`);
      throw new ServiceUnavailableException('A IA não conseguiu gerar a descrição. Tente de novo.');
    }
    return texto;
  }

  private chave(): string {
    const chave = this.config.get<string>('GEMINI_API_KEY')?.trim();
    if (!chave) {
      throw new ServiceUnavailableException(
        'Recurso de IA não configurado: defina GEMINI_API_KEY no .env da API.',
      );
    }
    return chave;
  }

  private async chamar(modelo: string, corpo: unknown): Promise<RespostaGemini> {
    const resposta = await fetch(`${BASE_URL}/${modelo}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.chave(),
      },
      body: JSON.stringify(corpo),
    });

    if (!resposta.ok) {
      const corpoErro = await resposta.text().catch(() => '');
      this.logger.warn(`Gemini ${modelo} respondeu ${resposta.status}: ${corpoErro.slice(0, 500)}`);
      if (resposta.status === 429) {
        throw new ServiceUnavailableException(
          'Limite gratuito do Gemini atingido — tente de novo em instantes.',
        );
      }
      throw new ServiceUnavailableException('Falha ao falar com a IA. Tente de novo.');
    }

    return resposta.json() as Promise<RespostaGemini>;
  }
}
