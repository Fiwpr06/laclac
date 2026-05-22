import { createCategoryAction, deleteCategoryAction, updateCategoryAction } from './actions';
import { fetchCategories } from '../../src/lib/api';

type CategoriesPageSearchParams = {
  status?: string;
  error?: string;
};

const STATUS_MESSAGE_MAP: Record<string, string> = {
  created: 'Da them category thanh cong.',
  updated: 'Da cap nhat category thanh cong.',
  deleted: 'Da xoa category thanh cong.',
};

export default async function CategoriesAdminPage({
  searchParams,
}: {
  searchParams?: CategoriesPageSearchParams;
}) {
  const categories = await fetchCategories();
  const statusMessage =
    searchParams?.status && STATUS_MESSAGE_MAP[searchParams.status]
      ? STATUS_MESSAGE_MAP[searchParams.status]
      : undefined;
  const errorMessage = searchParams?.error;

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-black text-slate-800">Danh mục</h1>

      {statusMessage ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          {statusMessage}
        </p>
      ) : null}

      {errorMessage ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          Loi: {errorMessage}
        </p>
      ) : null}

      <article className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-xl font-bold text-slate-800">Thêm category mới</h2>
        <form action={createCategoryAction} className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            name="name"
            placeholder="Tên category"
            className="rounded-lg border p-2"
            required
          />

          <select name="type" className="rounded-lg border p-2" defaultValue="cuisine" required>
            <option value="cuisine">cuisine</option>
            <option value="meal_type">meal_type</option>
            <option value="diet">diet</option>
          </select>

          <input name="icon" placeholder="Icon" className="rounded-lg border p-2" />
          <input
            name="sortOrder"
            type="number"
            min={0}
            placeholder="Sort order"
            className="rounded-lg border p-2"
          />

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="isActive" defaultChecked />
            Active
          </label>

          <button
            className="rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white md:col-span-2"
            type="submit"
          >
            Thêm category
          </button>
        </form>
      </article>

      <div className="grid gap-3 md:grid-cols-2">
        {categories.map((category) => (
          <article key={category._id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <form action={updateCategoryAction} className="grid gap-2">
              <input type="hidden" name="id" value={category._id} />

              <input
                name="name"
                defaultValue={typeof category.name === 'string' ? category.name : category.name?.vi}
                className="rounded-lg border p-2"
                required
              />

              <select
                name="type"
                className="rounded-lg border p-2"
                defaultValue={category.type}
                required
              >
                <option value="cuisine">cuisine</option>
                <option value="meal_type">meal_type</option>
                <option value="diet">diet</option>
              </select>

              <input
                name="icon"
                defaultValue={category.icon ?? ''}
                className="rounded-lg border p-2"
              />

              <input
                name="sortOrder"
                type="number"
                min={0}
                defaultValue={category.sortOrder ?? 0}
                className="rounded-lg border p-2"
              />

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" name="isActive" defaultChecked={category.isActive ?? true} />
                Active
              </label>

              <p className="text-xs text-slate-500">ID: {category._id}</p>

              <button
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                type="submit"
              >
                Lưu thay đổi
              </button>
            </form>

            <form action={deleteCategoryAction} className="mt-2">
              <input type="hidden" name="id" value={category._id} />
              <button
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700"
                type="submit"
              >
                Xóa category
              </button>
            </form>
          </article>
        ))}
      </div>
    </section>
  );
}
