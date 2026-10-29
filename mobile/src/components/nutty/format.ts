/**
 * Limpia la respuesta de Nutty para mostrarla como texto plano. El asistente tiene la
 * instrucción de no usar Markdown, pero a veces se le escapa: aquí se quitan los restos
 * (**negritas**, # títulos, viñetas con asterisco) para que no se vean símbolos raros.
 */
export function cleanReply(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\*\*(.+?)\*\*/gs, '$1')
    .replace(/__(.+?)__/gs, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^(\s*)[*•]\s+/gm, '$1- ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
