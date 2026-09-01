export type Tour = {
  id: string;
  type: "maraton" | "ciclismo";
  tag: string;
  metric: string;
  metricLabel: string;
  cardImage: string;
  modalImage: string;
  imageAlt: string;
  title: string;
  region: string;
  sub: string;
  route?: string;
  dates: string;
  days: string;
  deadline: string;
  cupo: string;
  nights: string;
  price: string;
  desc: string;
  highlights: string[];
  soldOut: boolean;
};

export const TOURS: Tour[] = [
  {
    id: "barcelona",
    type: "maraton",
    tag: "MARATÓN",
    metric: "42K",
    metricLabel: "DISTANCIA",
    cardImage: "",
    modalImage: "",
    imageAlt: "Maratón de Barcelona y recorrido por Barcelona y Costa Brava",
    title: "Maratón de Barcelona",
    region: "Barcelona y Costa Brava",
    sub: "Barcelona y Costa Brava",
    dates: "11 – 20 mar 2027",
    days: "10 días",
    deadline: "20 dic 2026",
    cupo: "10 viajeros",
    nights: "9 noches",
    price: "4.320",
    desc:
      "Una experiencia para descubrir Barcelona y la Costa Brava, combinando arquitectura, cultura y playa en las ciudades más atractivas del Mediterráneo, con varios días entre pueblos costeros, gastronomía local, caminatas y recorridos en bicicleta junto al mar.",
    highlights: [
      "Participa en la Maratón de Barcelona",
      "Transporte terrestre durante el recorrido en España",
      "Recorrido en bicicleta eléctrica por los bosques y la costa mediterránea",
      "Ruta gastronómica con degustaciones de productos y sabores del Mediterráneo",
    ],
    soldOut: false,
  },
  {
    id: "madrid",
    type: "maraton",
    tag: "MARATÓN",
    metric: "42K",
    metricLabel: "DISTANCIA",
    cardImage: "",
    modalImage: "",
    imageAlt: "Maratón de Madrid y recorrido por Madrid y Extremadura",
    title: "Maratón de Madrid",
    region: "Madrid y Extremadura",
    sub: "Madrid y Extremadura",
    dates: "22 abr – 1 may 2027",
    days: "10 días",
    deadline: "20 dic 2026",
    cupo: "10 viajeros",
    nights: "9 noches",
    price: "4.150",
    desc:
      "Nueve noches para descubrir Madrid y Extremadura, combinando la energía de la capital española con la autenticidad de la España rural. Una experiencia entre gastronomía, paisajes y ciudades Patrimonio de la Humanidad que narran la historia de España desde la época romana y árabe hasta hoy.",
    highlights: [
      "Participa en la Maratón de Madrid",
      "Espectáculo de flamenco en Madrid",
      "Transporte terrestre durante el recorrido en España",
      "Entrada a los recintos históricos romanos de Mérida",
      "Visita a una finca ganadera en la Dehesa Extremeña",
    ],
    soldOut: false,
  },
  {
    id: "praga",
    type: "maraton",
    tag: "MARATÓN",
    metric: "42K",
    metricLabel: "DISTANCIA",
    cardImage: "",
    modalImage: "",
    imageAlt: "Maratón de Praga y recorrido por Praga, Viena y Budapest",
    title: "Maratón de Praga",
    region: "Praga, Viena y Budapest",
    sub: "Praga, Viena y Budapest",
    dates: "29 abr – 8 may 2027",
    days: "10 días",
    deadline: "20 dic 2026",
    cupo: "10 viajeros",
    nights: "9 noches",
    price: "4.850",
    desc:
      "Nueve noches para recorrer Praga, Viena y Budapest y descubrir el legado del Imperio austrohúngaro. Un viaje entre algunas de las ciudades más bellas de Europa, reconocidas por su arquitectura monumental, su historia, sus paisajes y su extraordinaria vida cultural.",
    highlights: [
      "Participa en la Maratón de Praga",
      "Transporte terrestre durante el recorrido",
      "Entrada a una función de teatro, ópera o ballet en uno de los grandes escenarios de Praga",
      "Excursión de día completo a Budapest desde Viena",
    ],
    soldOut: false,
  },
  {
    id: "grandes-batallas",
    type: "ciclismo",
    tag: "CICLISMO",
    metric: "340 KM",
    metricLabel: "RECORRIDO",
    cardImage: "",
    modalImage: "",
    imageAlt: "Ruta ciclista Grandes Batallas por Francia y Bélgica",
    title: "Grandes Batallas",
    region: "Francia y Bélgica",
    sub: "Francia y Bélgica",
    route: "Lille · Ypres · Passchendaele · Pas de Calais",
    dates: "8 – 19 jul 2027",
    days: "12 días",
    deadline: "20 mar 2027",
    cupo: "Sujeto a disponibilidad",
    nights: "11 noches",
    price: "5.800",
    desc:
      "Una experiencia creada por WOPU para Actimax para cruzar la costa norte de Francia y Bélgica acompañado de un grupo de profesionales expertos. El recorrido atraviesa diversos escenarios de la Primera Guerra Mundial, incluyendo Ypres, Passchendaele, Tyne Cot, Mesina, la Cresta de Vimy, Lochnagar y Cambrai, a lo largo de 340 km por Francia y Bélgica.",
    highlights: [
      "340 kilómetros de recorrido en bicicleta por Francia y Bélgica",
      "Campo de la Batalla de Passchendaele",
      "Monumento de Tyne Cot",
      "Campo de Batalla de Cambrai",
      "Acompañamiento de un grupo de profesionales",
      "Alojamiento",
      "8 desayunos y 5 comidas",
      "Precio de inscripción indicado en la propuesta: 500 €",
    ],
    soldOut: false,
  },
  {
    id: "italia",
    type: "ciclismo",
    tag: "CICLISMO",
    metric: "1.846 KM",
    metricLabel: "RECORRIDO",
    cardImage: "",
    modalImage: "",
    imageAlt: "Ruta ciclista por Italia de Verona a Reggio Calabria",
    title: "Italia de punta a punta",
    region: "De Verona a Reggio Calabria",
    sub: "De Verona a Reggio Calabria",
    route:
      "Verona · Toscana · Roma · Nápoles · Pompeya · Costa Amalfitana · Reggio Calabria",
    dates: "2 – 25 sep 2027",
    days: "24 días",
    deadline: "20 mar 2027",
    cupo: "Sujeto a disponibilidad",
    nights: "23 noches",
    price: "9.050",
    desc:
      "Una gran travesía ciclista para recorrer Italia de norte a sur, desde Verona hasta Reggio Calabria. La ruta atraviesa algunos de los territorios más representativos del país: los Montes Apeninos, los paisajes de la Toscana, Roma, la bahía de Nápoles, Pompeya y la Costa Amalfitana, antes de alcanzar el extremo sur de la península.",
    highlights: [
      "1.846 kilómetros de recorrido en bicicleta por Italia",
      "Acompañamiento de un grupo guiado por un equipo de ciclistas expertos",
      "Cruce de los Montes Apeninos",
      "Recorrido por la Toscana y el Valle de Orcia",
      "La bahía de Nápoles",
      "Visita a las ruinas de Pompeya",
      "Recorrido por la Costa Amalfitana",
      "Doce cenas incluidas",
    ],
    soldOut: false,
  },
  {
    id: "andalucia",
    type: "ciclismo",
    tag: "CICLISMO",
    metric: "766 KM",
    metricLabel: "RECORRIDO",
    cardImage: "",
    modalImage: "",
    imageAlt: "Ruta ciclista por Andalucía",
    title: "Andalucía en bicicleta",
    region: "Granada, Málaga y Córdoba",
    sub: "Empieza y termina en Málaga",
    route: "Málaga · Ronda · Sevilla · Córdoba · Granada · Nerja · Málaga",
    dates: "14 – 25 oct 2027",
    days: "12 días",
    deadline: "20 mar 2027",
    cupo: "Sujeto a disponibilidad",
    nights: "11 noches",
    price: "6.420",
    desc:
      "Una travesía por una de las regiones más fascinantes de España, con una ruta exigente pero alcanzable que combina montaña, caminos rurales y paisajes mediterráneos. El recorrido atraviesa ciudades y pueblos marcados por el legado romano, árabe y cristiano, conectando el desafío deportivo con la historia, la arquitectura y la cultura andaluza.",
    highlights: [
      "766 kilómetros de recorrido en bicicleta por Andalucía",
      "Acompañamiento de un grupo guiado por un equipo de ciclistas expertos",
      "Visita a la Alhambra de Granada",
      "Visita a Ronda y su emblemático puente",
      "Visita a Córdoba",
      "Cinco cenas incluidas",
    ],
    soldOut: false,
  },
];

export const FAQS = [
  {
    q: "¿Qué incluye cada viaje?",
    a: "La propuesta general contempla vuelos de ida y regreso entre Colombia y Europa según las condiciones de cada destino, alojamiento, gestión de la inscripción a la actividad deportiva y acompañamiento de WOPU Travel. Los detalles específicos de cada experiencia se confirman antes de reservar.",
  },
  {
    q: "¿Cuántos cupos hay por experiencia?",
    a: "Las experiencias de maratón contemplan grupos de 10 viajeros. Las rutas de ciclismo están sujetas a disponibilidad.",
  },
  {
    q: "¿Hasta cuándo puedo reservar?",
    a: "Las experiencias de maratón muestran como fecha de reserva el 20 de diciembre de 2026. Las rutas de ciclismo muestran el 20 de marzo de 2027, siempre sujeto a disponibilidad.",
  },
  {
    q: "¿Los precios están expresados en euros?",
    a: "Sí. Las tarjetas muestran precios desde en euros por persona. El valor final y sus condiciones se confirman con WOPU Travel antes de realizar la reserva.",
  },
  {
    q: "¿Quién diseña y opera los viajes?",
    a: "WOPU Travel diseña y opera la logística de los recorridos, mientras Actimax acompaña la experiencia desde su comunidad y enfoque deportivo.",
  },
  {
    q: "¿Cómo puedo pedir información de una experiencia?",
    a: "Puedes completar el formulario de preinscripción o escribir directamente por WhatsApp. El equipo de WOPU Travel te contactará con la información de la experiencia elegida.",
  },
] as const;
