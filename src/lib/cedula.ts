/** Se aceptan puntos y espacios de miles al digitar (ej. "1.035.467.890"). */
export function normalizeCedula(value: string): string {
  return value.replace(/[.\s]/g, "");
}

/** La cédula colombiana tiene entre 6 y 10 dígitos. */
export function isValidCedula(value: string): boolean {
  return /^\d{6,10}$/.test(normalizeCedula(value));
}
