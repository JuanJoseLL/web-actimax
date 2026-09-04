import "react";

/**
 * Custom element del widget de cuotas de Addi. Lo carga
 * `AddiWidget` desde el CDN de Addi, así que no hay tipos que importar.
 */
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "addi-product-widget": React.HTMLAttributes<HTMLElement> & {
        "ally-slug": string;
        price: number;
        country: string;
      };
    }
  }
}
