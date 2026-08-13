import { getRepository } from "@/lib/db";
import { MenuBrowser } from "@/components/MenuBrowser";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const items = await getRepository().listMenuItems();

  return (
    <div>
      <div className="mb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-rail-mustard">
          Fresh off the pass
        </p>
        <h1 className="font-display text-3xl font-black uppercase tracking-tight text-rail-paper">
          Tonight&apos;s Menu
        </h1>
      </div>
      <MenuBrowser items={items} />
    </div>
  );
}
