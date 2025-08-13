import { DataTable } from "@/components/data-table";
import { createCategory, listCategories } from "@/server/categories";
import { revalidatePath } from "next/cache";
import staticData from "../dashboard/data.json"
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
    <>
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
 
    <div className="flex flex-1 flex-col">

          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <DataTable data={staticData} />

              
            </div>
          </div>
        </div>

        </>
  );
}