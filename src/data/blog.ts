export interface BlogPost {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  date: string;
  minutes: number;
  bodyHtml: string;
}

// Artículos de muestra para el demo. En la versión final se escriben y
// publican desde el panel de administración, igual que los productos.
export const posts: BlogPost[] = [
  {
    slug: "cuantos-geles-llevar-maraton",
    title: "¿Cuántos geles llevar a tu primera maratón?",
    category: "Running",
    excerpt:
      "La regla de los 40 minutos, cómo probarlos en tus fondos y por qué nunca debes estrenar nutrición el día de la carrera.",
    date: "2026-06-28",
    minutes: 4,
    bodyHtml: `
      <p>Si vas a correr 42K, tu cuerpo va a necesitar combustible externo mucho antes de lo que crees. Las reservas de glucógeno alcanzan para 90 minutos de esfuerzo, aproximadamente: de ahí en adelante, lo que no repongas lo vas a pagar en los últimos kilómetros.</p>
      <p><b>La regla general:</b> un gel cada 40–45 minutos de carrera, empezando desde el minuto 45. Para una maratón de 4 horas, eso significa entre 4 y 5 geles.</p>
      <ul>
        <li>Prueba los geles en tus fondos largos, nunca los estrenes el día de la carrera.</li>
        <li>Toma cada gel con agua, no con bebida deportiva, para facilitar la absorción.</li>
        <li>Si tu carrera es de más de 3 horas, alterna geles con y sin cafeína.</li>
      </ul>
      <p>El <b>Energy Pack Maratón 42K</b> viene armado con esta lógica: la cantidad exacta de geles, bebida y recuperación para que no tengas que improvisar.</p>
    `,
  },
  {
    slug: "hidratacion-clima-caliente",
    title: "Hidratación en clima caliente: lo que cambia cuando entrenas en tierra caliente",
    category: "Hidratación",
    excerpt:
      "Entrenar en Medellín no es lo mismo que competir en Cartagena. Cómo ajustar tu plan de hidratación cuando sube la temperatura.",
    date: "2026-06-14",
    minutes: 5,
    bodyHtml: `
      <p>En clima caliente puedes perder entre 1 y 2 litros de líquido por hora de ejercicio, y con ellos se van los electrolitos que hacen que tus músculos funcionen. Reponer solo con agua diluye el sodio que te queda: por eso los calambres aparecen justo cuando más agua pura tomas.</p>
      <p><b>Ajustes clave para competir en tierra caliente:</b></p>
      <ul>
        <li>Empieza a hidratarte desde el día anterior, no en la línea de salida.</li>
        <li>Usa bebida deportiva con electrolitos durante el esfuerzo, no después.</li>
        <li>Calcula 500–750 ml por hora, en tragos pequeños cada 15 minutos.</li>
        <li>Si la carrera dura más de 2 horas, suma sodio extra en los avituallamientos.</li>
      </ul>
      <p>La <b>Bebida Deportiva Élite</b> está formulada justo para esto: carbohidratos de absorción rápida más los electrolitos que pierdes sudando.</p>
    `,
  },
  {
    slug: "ventana-recuperacion-30-minutos",
    title: "La ventana de los 30 minutos: por qué la recuperación empieza en la meta",
    category: "Recuperación",
    excerpt:
      "Lo que consumes en la primera media hora después del esfuerzo define cómo amaneces mañana. La ciencia detrás de la recuperación.",
    date: "2026-05-30",
    minutes: 3,
    bodyHtml: `
      <p>Después de un esfuerzo largo, tus músculos quedan con las reservas vacías y microrroturas que hay que reparar. En los primeros 30 minutos tras la meta, el cuerpo absorbe nutrientes hasta tres veces más rápido de lo normal: esa es la famosa <b>ventana de recuperación</b>.</p>
      <p><b>Qué necesita tu cuerpo en esa ventana:</b></p>
      <ul>
        <li>Carbohidratos para recargar el glucógeno que gastaste.</li>
        <li>Proteína para iniciar la reparación muscular (relación 3:1 o 4:1).</li>
        <li>Líquido y electrolitos para volver al equilibrio.</li>
      </ul>
      <p>Un batido de <b>Recovery Pro</b> apenas cruces la meta cubre los tres frentes. Tu yo de mañana, que quiere bajar las escaleras sin dolor, te lo agradece.</p>
    `,
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}

export function formatPostDate(iso: string): string {
  return new Date(`${iso}T12:00:00-05:00`).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
