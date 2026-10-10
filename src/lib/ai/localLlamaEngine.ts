import { Platform } from 'react-native';
import { localModelManager } from './localModelManager';
import { normalizeTag, matchExistingTag } from '@/lib/tags/autoTags';

// Dynamic import holder for llama.rn to avoid crashes in unsupported environments
let llamaRnModule: typeof import('llama.rn') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  llamaRnModule = require('llama.rn');
} catch {
  // Not supported or not built yet
}

type LlamaContext = import('llama.rn').LlamaContext;

class LocalLlamaEngine {
  private context: LlamaContext | null = null;
  private isLoading = false;
  private lastInferenceTime = 0;

  public isAvailable(): boolean {
    return Boolean(llamaRnModule && localModelManager.isModelDownloaded());
  }

  public async getContext(): Promise<LlamaContext | null> {
    if (!llamaRnModule) return null;
    if (this.context) return this.context;
    if (this.isLoading) return null;

    if (!localModelManager.isModelDownloaded()) {
      return null;
    }

    this.isLoading = true;
    try {
      const modelFile = localModelManager.getModelFile();
      // On iOS / Android, llama.cpp requires the clean filesystem path
      const modelPath = modelFile.uri.startsWith('file://')
        ? modelFile.uri.replace('file://', '')
        : modelFile.uri;

      const initLlama = llamaRnModule.initLlama;
      const ctx = await initLlama({
        model: modelPath,
        n_ctx: 2048,
        n_gpu_layers: Platform.OS === 'ios' ? 99 : 0, // Metal GPU on iOS
        use_mlock: true,
      });

      this.context = ctx;
      return ctx;
    } catch (e) {
      console.warn('Failed to initialize local llama context:', e);
      return null;
    } finally {
      this.isLoading = false;
    }
  }

  public async releaseContext(): Promise<void> {
    if (this.context) {
      try {
        await this.context.stopCompletion();
      } catch {
        // ignore
      }
      this.context = null;
    }
  }

  public async generateTags(params: {
    title?: string;
    text?: string;
    note?: string;
    url?: string;
    existingTags?: string[];
    maxTags?: number;
  }): Promise<string[] | null> {
    const { title = '', text = '', note = '', url = '', existingTags = [], maxTags = 4 } = params;

    const ctx = await this.getContext();
    if (!ctx) {
      return null;
    }

    const cleanExisting = existingTags.slice(0, 30).join(', ');

    const prompt = `<|im_start|>system
Você é um assistente de inteligência artificial especializado em organizar conhecimento e segundo cérebro.
Sua tarefa é analisar o conteúdo fornecido e extrair entre 2 e ${maxTags} tags semânticas essenciais que capturem o tema central, a intenção e a área de conhecimento.

Tags que o usuário já utiliza: [${cleanExisting || 'nenhuma'}]

Regras:
1. Priorize e reutilize as tags existentes do usuário quando forem adequadas.
2. NUNCA gere palavras genéricas ou vazias (como "app", "post", "coisas", "building", "ways").
3. Use apenas letras minúsculas e hífens se necessário (ex: "mobile", "tutorial", "inteligencia-artificial", "produtividade").
4. Responda ESTRITAMENTE em formato JSON:
{"tags": ["tag1", "tag2"]}
<|im_end|>
<|im_start|>user
Título: ${title.slice(0, 200)}
Conteúdo: ${text.slice(0, 400)}
Nota: ${note.slice(0, 200)}
URL: ${url}
<|im_end|>
<|im_start|>assistant
`;

    try {
      this.lastInferenceTime = Date.now();
      const completion = await ctx.completion({
        prompt,
        n_predict: 64, // Just enough for the tags JSON
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const outputText = completion.text.trim();
      const match = outputText.match(/\{[\s\S]*\}/);
      if (!match) return null;

      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed.tags)) {
        const cleaned: string[] = [];
        for (const raw of parsed.tags) {
          if (typeof raw === 'string') {
            const norm = normalizeTag(raw);
            if (norm && norm.length >= 2 && norm.length <= 30) {
              const matched = matchExistingTag(norm, existingTags);
              const finalTag = matched ?? norm;
              if (!cleaned.includes(finalTag)) {
                cleaned.push(finalTag);
              }
            }
          }
        }
        return cleaned.slice(0, maxTags);
      }
      return null;
    } catch (e) {
      console.warn('Local LLM tagging failed:', e);
      return null;
    }
  }

  public getLastInferenceTime(): number {
    return this.lastInferenceTime;
  }
}

export const localLlamaEngine = new LocalLlamaEngine();
