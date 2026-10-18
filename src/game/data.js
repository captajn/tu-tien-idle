// Nạp toàn bộ content data-driven từ data/*.json.
// Muốn thêm map/vật phẩm/công pháp mới: chỉ sửa JSON, không đụng code.

const FILES = ['realms', 'techniques', 'maps', 'items', 'equipment', 'quests', 'skills', 'companions', 'alchemy'];

export async function loadData() {
  const out = {};
  for (const f of FILES) {
    const res = await fetch(`./data/${f}.json`);
    if (!res.ok) throw new Error('Thiếu file data/' + f + '.json');
    out[f] = await res.json();
  }
  return out;
}
