import { getAllBlogPosts } from "@/lib/blog";
import { searchBlogPosts } from "@/lib/blog-search";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.slice(0, 300) ?? "";
  const posts = await getAllBlogPosts(true);
  return Response.json(searchBlogPosts(posts, query));
}
