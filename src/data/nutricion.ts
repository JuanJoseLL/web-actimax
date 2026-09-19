/** Fuente: Catálogo Actimax 2026 suministrado por la marca.
 * Las cifras son declaraciones del catálogo, no análisis independientes.
 * null significa «no declarado», nunca cero ni «libre de».
 */
export interface Nutrientes {
  carbohidratosG: number;
  proteinaG: number | null;
  sodioMg: number | null;
  cafeinaMg: number | null;
}

export interface FormulaNutricional {
  nombre: string;
  gramos: number;
  base: string;
  nutrientes: Nutrientes;
  preparacion: string | null;
  uso: string;
  momentos: Array<"antes" | "durante" | "despues">;
  ingredientesDeclarados: string[];
  /** El catálogo no asigna los iconos de marca a productos individuales. */
  atributos: { vegano: boolean | null; sinLacteos: boolean | null; sinGluten: boolean | null };
  notas: string[];
  /** Información adicional por porción, con las unidades originales. */
  tabla: Record<string, string>;
}

const atributosDesconocidos = { vegano: null, sinLacteos: null, sinGluten: null };
const vitaminasPre = {
  vitaminaA: "110 µg ER", vitaminaC: "22 mg", calcio: "475 mg", hierro: "4,3 mg",
  vitaminaE: "2,0 mg", vitaminaB1: "0,12 mg", vitaminaB3: "2,0 mg", vitaminaB6: "0,37 mg",
  vitaminaB9: "59 µg", vitaminaB12: "0,37 µg", fosforo: "239 mg", magnesio: "12 mg", zinc: "2,2 mg",
};
const vitaminasElite = {
  vitaminaC: "6,2 mg", vitaminaB2: "0,15 mg", vitaminaB3: "1,5 mg",
  vitaminaB6: "0,24 mg", vitaminaB12: "0,10 µg", vitaminaB5: "0,70 mg",
};
const vitaminasRecoveryPro = {
  vitaminaA: "92 µg ER", vitaminaC: "51 mg", calcio: "246 mg", hierro: "0,95 mg",
  vitaminaD: "0,61 µg", vitaminaB12: "0,29 µg", fosforo: "157 mg", magnesio: "18 mg", zinc: "0,30 mg",
};

export const FORMULAS: Record<string, FormulaNutricional> = {
  pre: {
    nombre: "Pre Race", gramos: 36, base: "1 porción de 36 g",
    nutrientes: { carbohidratosG: 25, proteinaG: 6.2, sodioMg: 86, cafeinaMg: 0 },
    preparacion: "36 g en 250 ml de bebida, según la preparación del catálogo.",
    uso: "30 minutos antes de la actividad; también como ración de espera entre pruebas.",
    momentos: ["antes"], ingredientesDeclarados: [], atributos: atributosDesconocidos,
    notas: ["La tabla nutricional usa 240 ml; la preparación indica 250 ml. Se conservan las cifras declaradas por porción de 36 g, sin recalcular por volumen.", "El tarro menciona 2½ cucharadas y 2 scoops: usar gramos, no equiparar medidas."],
    tabla: { calorias: "133 kcal", grasaTotal: "1,1 g", grasaSaturada: "0,4 g", grasaTrans: "0 mg", fibra: "1,2 g", azucares: "6,9 g", azucaresAnadidos: "1,1 g", ...vitaminasPre },
  },
  energy: {
    nombre: "Energy Gel", gramos: 30, base: "1 tubo de 30 g",
    nutrientes: { carbohidratosG: 22, proteinaG: null, sodioMg: null, cafeinaMg: 0 },
    preparacion: null, uso: "Según el catálogo: 1 tubo cada 30 min en competencia o cada 45 min en entrenamiento; 1–2 por hora según necesidades en esfuerzos de más de una hora.",
    momentos: ["durante"], ingredientesDeclarados: [], atributos: atributosDesconocidos,
    notas: ["«No es fuente significativa» de sodio o proteína no equivale a una cantidad exacta de cero."],
    tabla: { calorias: "89 kcal", azucares: "6,7 g", azucaresAnadidos: "6,7 g" },
  },
  gel30: {
    nombre: "Gel Energético 30 g", gramos: 30, base: "1 sobre de 30 g",
    nutrientes: { carbohidratosG: 9.4, proteinaG: null, sodioMg: 40, cafeinaMg: 9.6 },
    preparacion: null, uso: "Según el catálogo: 1 sobre cada 30 min en competencia o cada 45 min en entrenamiento; 1–2 por hora en esfuerzos de más de una hora.",
    momentos: ["durante"], ingredientesDeclarados: [], atributos: atributosDesconocidos,
    notas: ["La composición y la cafeína dependen del sabor; Fresa-banano no contiene cafeína."], tabla: {},
  },
  gel90: {
    nombre: "Gel Energético 90 g", gramos: 90, base: "1 sobre completo de 90 g",
    nutrientes: { carbohidratosG: 28, proteinaG: null, sodioMg: 121, cafeinaMg: 28.8 },
    preparacion: null, uso: "Según el catálogo: medio sobre cada 30 min en competencia o cada 45 min en entrenamiento. Opción para esfuerzos de más de 2 horas.",
    momentos: ["durante"], ingredientesDeclarados: [], atributos: atributosDesconocidos,
    notas: ["La composición corresponde al sobre completo; medio sobre aporta la mitad.", "Fresa-banano no contiene cafeína."], tabla: {},
  },
  eliteSin: {
    nombre: "Bebida Élite sin cafeína", gramos: 30, base: "1 bidón de 500 ml preparado con 30 g",
    nutrientes: { carbohidratosG: 27.5, proteinaG: null, sodioMg: 255, cafeinaMg: 0 },
    preparacion: "30 g en 500 ml de agua.", uso: "El catálogo propone 500 ml por hora, distribuidos cada 10–15 min; es una guía de producto, no una medición de sudoración personal.",
    momentos: ["durante"], ingredientesDeclarados: [], atributos: atributosDesconocidos,
    notas: ["Para los cálculos se usan los destacados por bidón de 500 ml. La tabla declara 13 g de carbohidratos y 122 mg de sodio por 15 g/240 ml; no se mezclan ambas bases.", "500 g permiten 16 bidones completos de 30 g y un resto de 20 g; «17 bidones» es aproximado.", "Sellos declarados: exceso en sodio, exceso en azúcares, contiene edulcorantes."],
    tabla: { baseTabla: "15 g preparados en 240 ml", calorias: "53 kcal", carbohidratos: "13 g", sodio: "122 mg", potasio: "41 mg (85 mg por bidón)", azucares: "6 g", azucaresAnadidos: "6 g", ...vitaminasElite, calcio: "51 mg", hierro: "0,58 mg", vitaminaE: "6,3 mg", zinc: "3,7 mg" },
  },
  eliteCon: {
    nombre: "Bebida Élite con cafeína", gramos: 30, base: "1 bidón de 500 ml preparado con 30 g",
    nutrientes: { carbohidratosG: 27.5, proteinaG: null, sodioMg: 250, cafeinaMg: 55 },
    preparacion: "1 sobre de 30 g o 30 g del tarro en 500 ml de agua.",
    uso: "El catálogo propone 500 ml por hora, distribuidos cada 10–15 min; es una guía de producto, no una medición de sudoración personal.",
    momentos: ["durante"], ingredientesDeclarados: [], atributos: atributosDesconocidos,
    notas: ["La tabla usa 15 g/240 ml; los destacados usan 30 g/500 ml. Los cálculos usan exclusivamente los destacados por bidón.", "55 mg de cafeína por bidón completo, no por media porción.", "Sellos del tarro: exceso en sodio, exceso en azúcares, contiene edulcorantes."],
    tabla: { baseTabla: "15 g preparados en 240 ml", calorias: "54 kcal", carbohidratos: "13 g", sodio: "121 mg", azucares: "6 g", azucaresAnadidos: "6 g", ...vitaminasElite },
  },
  bar: {
    nombre: "Protein Bar", gramos: 35, base: "1 barra de 35 g",
    nutrientes: { carbohidratosG: 17, proteinaG: 12.8, sodioMg: 145, cafeinaMg: null },
    preparacion: null, uso: "30–60 minutos antes; durante esfuerzos de más de 2 horas; o después de entrenar.",
    momentos: ["antes", "durante", "despues"], ingredientesDeclarados: ["soya", "miel", "chocolate"],
    atributos: { vegano: false, sinLacteos: null, sinGluten: null },
    notas: ["Contiene miel: no describir como vegana. La cafeína y los iconos libres de alérgenos no están declarados.", "Sellos: exceso en sodio y exceso en azúcares."],
    tabla: { calorias: "131 kcal", grasaTotal: "3 g", grasaSaturada: "1,5 g", grasaTrans: "0 mg", colesterol: "16 mg", polialcoholes: "8 g", fibra: "0,7 g", azucares: "5 g", azucaresAnadidos: "4,5 g", calcio: "88 mg" },
  },
  recoveryPro: {
    nombre: "Recovery Pro", gramos: 37, base: "1 porción de 37 g",
    nutrientes: { carbohidratosG: 8.3, proteinaG: 24, sodioMg: 181, cafeinaMg: null },
    preparacion: "37 g en 250 ml de agua.", uso: "Después de entrenamientos o competencias intensas; el catálogo propone los primeros 30 minutos.",
    momentos: ["despues"], ingredientesDeclarados: ["proteína de suero hidrolizada", "caseinato de calcio", "proteína aislada de soya", "BCAA", "L-carnitina", "glutamina"],
    atributos: { vegano: false, sinLacteos: false, sinGluten: null },
    notas: ["Se anuncian 4 proteínas pero solo se nombran 3; no inventar una cuarta.", "Tabla por 240 ml y preparación por 250 ml: conservar valores por 37 g.", "400 g rinden 10 porciones completas de 37 g y un resto de 30 g; «11» es aproximado.", "La caja declara grasa total no significativa; el tarro declara 1,2 g. No usar ese valor del tarro para afirmar la grasa de la caja."],
    tabla: { calorias: "139 kcal", grasaSaturada: "0,5 g", colesterol: "21 mg", azucares: "4,9 g", ...vitaminasRecoveryPro },
  },
  recovery: {
    nombre: "Recovery", gramos: 35, base: "1 porción de 35 g",
    nutrientes: { carbohidratosG: 19, proteinaG: 12, sodioMg: 122, cafeinaMg: null },
    preparacion: "35 g en 250 ml de agua; las medidas volumétricas del catálogo son inconsistentes.",
    uso: "Después de entrenamientos o competencias intensas.", momentos: ["despues"],
    ingredientesDeclarados: ["proteína de suero hidrolizada", "caseinato de calcio", "proteína aislada de soya", "BCAA"],
    atributos: { vegano: false, sinLacteos: false, sinGluten: null },
    notas: ["Tabla por 240 ml y preparación por 250 ml: conservar valores por 35 g.", "La ficha menciona 2½ cucharadas y la preparación 2 medidas; usar gramos."],
    tabla: { calorias: "124 kcal", azucares: "6,9 g", azucaresAnadidos: "6,9 g", vitaminaC: "7,1 mg", calcio: "271 mg", hierro: "2,8 mg", vitaminaD: "2,0 µg", vitaminaB2: "0,18 mg", vitaminaB3: "1,7 mg", vitaminaB6: "0,27 mg", vitaminaB12: "0,12 µg", fosforo: "198 mg", magnesio: "8,1 mg", vitaminaB5: "0,80 mg" },
  },
};

export interface PresentacionNutricional {
  formula: string;
  envase: string;
  /** Masa real del envase: permite redondear compras sin sobreestimar el rendimiento. */
  gramosEnvase: number;
  sabores: string[];
}

/** Identidades explícitas: jamás asignar una fórmula por similitud del título. */
export const PRESENTACIONES: Record<string, PresentacionNutricional> = {
  "pre-race-caja-x12": { formula: "pre", envase: "Caja de 12 sobres", gramosEnvase: 432, sabores: ["fresa", "vainilla", "caramelo"] },
  "pre-race-en-tarro-400gr": { formula: "pre", envase: "Tarro de 500 g", gramosEnvase: 500, sabores: ["fresa", "vainilla", "caramelo"] },
  "energy-gel-caja-x24": { formula: "energy", envase: "Caja de 24 tubos", gramosEnvase: 720, sabores: ["kiwi", "durazno", "cookiescream"] },
  "gl-energetico-actimax-sachets-x24-con-cafeina": { formula: "gel30", envase: "Caja de 24 sobres", gramosEnvase: 720, sabores: ["mango", "fresa", "manzana"] },
  "gel-energetico-sachets-x24-sin-cafeina": { formula: "gel30", envase: "Caja de 24 sobres", gramosEnvase: 720, sabores: ["fresabanano"] },
  "gel-energetico-actimax-caja-x8-con-cafeina": { formula: "gel90", envase: "Caja de 8 sobres", gramosEnvase: 720, sabores: ["mango", "fresa", "manzana"] },
  "gel-energetico-actimax-caja-x8": { formula: "gel90", envase: "Caja de 8 sobres", gramosEnvase: 720, sabores: ["fresabanano"] },
  "bebida-deportiva-elite-tarro-500gr": { formula: "eliteSin", envase: "Tarro de 500 g", gramosEnvase: 500, sabores: ["limon", "tuttifrutti", "uva"] },
  "bebida-deportiva-elite-con-cafeina-tarro-de-500gr": { formula: "eliteCon", envase: "Tarro de 500 g", gramosEnvase: 500, sabores: ["limon", "tuttifrutti", "naranja", "uva"] },
  "pack-sachets-bebida-elite-cafeina": { formula: "eliteCon", envase: "Caja de 20 sobres", gramosEnvase: 600, sabores: ["limon", "tuttifrutti", "naranja", "uva"] },
  "protein-bar-caja-x18": { formula: "bar", envase: "Caja de 18 barras", gramosEnvase: 630, sabores: [] },
  "recovery-pro-tarro-400gr": { formula: "recoveryPro", envase: "Tarro de 400 g", gramosEnvase: 400, sabores: ["vainillaitaliana", "fresa"] },
  "recovery-pro-caja-x12": { formula: "recoveryPro", envase: "Caja de 12 sobres", gramosEnvase: 444, sabores: ["vainillaitaliana", "fresa"] },
  "recovery-tarro-400gr": { formula: "recovery", envase: "Tarro de 400 g", gramosEnvase: 400, sabores: ["vainillaitaliana", "fresa"] },
};

export const COMPOSICION_GELES: Record<string, { pequeno: Nutrientes; grande: Nutrientes }> = {
  mango: { pequeno: { carbohidratosG: 9.4, sodioMg: 40, cafeinaMg: 9.6, proteinaG: null }, grande: { carbohidratosG: 28, sodioMg: 121, cafeinaMg: 28.8, proteinaG: null } },
  fresa: { pequeno: { carbohidratosG: 9.5, sodioMg: 39, cafeinaMg: 9.6, proteinaG: null }, grande: { carbohidratosG: 28, sodioMg: 117, cafeinaMg: 28.8, proteinaG: null } },
  manzana: { pequeno: { carbohidratosG: 10, sodioMg: 39, cafeinaMg: 9.6, proteinaG: null }, grande: { carbohidratosG: 30, sodioMg: 117, cafeinaMg: 28.8, proteinaG: null } },
  fresabanano: { pequeno: { carbohidratosG: 9.6, sodioMg: 39, cafeinaMg: 0, proteinaG: null }, grande: { carbohidratosG: 29, sodioMg: 117, cafeinaMg: 0, proteinaG: null } },
};
