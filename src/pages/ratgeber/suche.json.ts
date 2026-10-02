import { getCollection } from 'astro:content';
import { baueSuchindex, sortiere } from '../../utils/ratgeber';

export async function GET() {
  const eintraege = await getCollection('ratgeber');
  return new Response(JSON.stringify(baueSuchindex(sortiere(eintraege))), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
