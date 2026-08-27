import { NextResponse } from "next/server";

const ECB_DAILY_XML =
  "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";

const TRM_ENDPOINT =
  "https://www.datos.gov.co/resource/mcec-87by.json?$select=valor,vigenciadesde&$order=vigenciadesde%20DESC&$limit=1";

function parseEcb(xml: string) {
  const usd = xml.match(/currency=['"]USD['"]\s+rate=['"]([0-9.]+)['"]/i);
  const date = xml.match(/time=['"](\d{4}-\d{2}-\d{2})['"]/i);

  if (!usd?.[1] || !date?.[1]) {
    throw new Error("Could not parse ECB reference rate");
  }

  return { eurUsd: Number(usd[1]), date: date[1] };
}

function formatDate(value: string) {
  const date = value.slice(0, 10);
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

export async function GET() {
  try {
    const [ecbResponse, trmResponse] = await Promise.all([
      fetch(ECB_DAILY_XML, {
        next: { revalidate: 21600 },
        headers: { Accept: "application/xml,text/xml" },
      }),
      fetch(TRM_ENDPOINT, {
        next: { revalidate: 21600 },
        headers: { Accept: "application/json" },
      }),
    ]);

    if (!ecbResponse.ok || !trmResponse.ok) {
      throw new Error("Official exchange-rate source unavailable");
    }

    const [ecbXml, trmRows] = await Promise.all([
      ecbResponse.text(),
      trmResponse.json() as Promise<
        Array<{ valor?: string; vigenciadesde?: string }>
      >,
    ]);

    const ecb = parseEcb(ecbXml);
    const trm = trmRows[0];

    if (!trm?.valor || !trm.vigenciadesde) {
      throw new Error("Could not parse TRM");
    }

    const usdCop = Number(trm.valor);
    const eurCop = ecb.eurUsd * usdCop;

    if (!Number.isFinite(eurCop) || eurCop <= 0) {
      throw new Error("Invalid EUR/COP calculation");
    }

    return NextResponse.json(
      {
        ok: true,
        eurCop: Math.round(eurCop),
        eurUsd: ecb.eurUsd,
        usdCop,
        ecbDate: formatDate(ecb.date),
        trmDate: formatDate(trm.vigenciadesde),
        methodology: "EUR/USD BCE × USD/COP TRM",
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=21600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    console.error("Destinos exchange-rate error:", error);
    return NextResponse.json(
      {
        ok: false,
        message: "La tasa de referencia no está disponible temporalmente.",
      },
      { status: 503 },
    );
  }
}
