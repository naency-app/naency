import { createCategory, listCategories } from "@/server/categories";
import { revalidatePath } from "next/cache";

export default async function CategoriesPage() {
  const cats = await listCategories();

  async function handleCreate(formData: FormData) {
    "use server";
    await createCategory({
      name: formData.get("name"),
      color: formData.get("color"),
    });
    revalidatePath("/categories");
  }

  return (
    <main className="p-6 space-y-4">
      <form action={handleCreate} className="flex gap-2">
        <input
          name="name"
          placeholder="Nome da categoria"
          className="border rounded px-3 py-2"
          required
        />
        <input
          name="color"
          placeholder="Cor (opcional)"
          className="border rounded px-3 py-2"
        />
        <button className="bg-black text-white px-4 py-2 rounded">
          Criar
        </button>
      </form>

      <ul className="mt-4">
        {cats.map((c) => (
          <li key={c.id}>
            <span style={{ color: c.color || "#000" }}>{c.name}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}