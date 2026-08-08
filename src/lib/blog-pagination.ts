export const POSTS_PER_PAGE = 12;

export function getBlogPageParams(postCount: number): Array<{ numero: string }> {
  const totalPages = Math.max(1, Math.ceil(postCount / POSTS_PER_PAGE));
  // La página 1 vive en /blog/; aquí solo se generan las siguientes.
  const params = Array.from({ length: totalPages - 1 }, (_, index) => ({
    numero: String(index + 2),
  }));

  // Cache Components exige al menos un parámetro para validar la ruta.
  return params.length > 0 ? params : [{ numero: "__placeholder__" }];
}
