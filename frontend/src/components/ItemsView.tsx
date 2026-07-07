// Example feature screen — a per-user list of "items". Copy this pattern for
// your own resource, and remember to add a diagnostics step for it.
import { useEffect, useState } from "react";
import { api } from "../api";
import type { Item } from "../types";

export function ItemsView() {
  const [items, setItems] = useState<Item[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    const { items } = await api.listItems();
    setItems(items);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      await api.createItem(title.trim(), body.trim());
      setTitle("");
      setBody("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await api.deleteItem(id);
    setItems((prev) => prev.filter((i) => i.itemId !== id));
  }

  return (
    <div className="panel">
      <h2>Items</h2>
      <p className="hint">
        This is the example resource. Replace it with your app's real content —
        see <code>docs/CUSTOMIZE.md</code>.
      </p>

      <form className="item-form" onSubmit={add}>
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Body (optional)"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <button type="submit" disabled={busy || !title.trim()}>
          {busy ? "Adding…" : "Add item"}
        </button>
      </form>

      {loading ? (
        <div className="spinner" />
      ) : items.length === 0 ? (
        <p className="hint">No items yet — add one above.</p>
      ) : (
        <ul className="item-list">
          {items.map((i) => (
            <li key={i.itemId} className="item">
              <div className="item-main">
                <strong>{i.title}</strong>
                {i.body && <span className="item-body">{i.body}</span>}
              </div>
              <button className="text-btn danger" onClick={() => remove(i.itemId)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
