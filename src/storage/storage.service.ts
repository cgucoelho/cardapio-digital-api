export interface ArquivoEnviado {
  buffer: Buffer;
  filename: string;
  mimetype: string;
}

/** Contrato de upload de imagem. Token de DI (Supabase Storage ou disco local). */
export abstract class StorageService {
  /** Salva o arquivo e devolve a URL pública. */
  abstract upload(arquivo: ArquivoEnviado): Promise<string>;
}

/** Nome de arquivo previsível e seguro: timestamp + slug do original. */
export function nomeSeguro(original: string): string {
  const limpo = original
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(-60);
  return `${Date.now()}-${limpo || 'foto.jpg'}`;
}
