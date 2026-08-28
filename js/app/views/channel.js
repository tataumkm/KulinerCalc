import { el, money, num, pct, input, select, btn, card, fieldBlock, toast } from "../ui.js";
import { getState, addChannel, updateChannel, deleteChannel, setMenuPrice, getMenuPrice, channelProfit, listMenus } from "../../data/state.js";

export function renderChannel(main) {
  const s = getState();
  const channels = s.channels;
  const menus = listMenus();

  const list = el("div", { class: "space-y-2" }, channels.length
    ? channels.map((c) => channelCard(c))
    : [el("p", { class: "text-sm text-gray-500 text-center py-6", text: "Belum ada channel." })]);

  main.append(
    el("div", { class: "space-y-4" }, [
      el("p", { class: "text-sm text-gray-600", text: "Kelola channel penjualan & fee-nya. Semua angka bisa diubah sesuai platform." }),
      list,
      btn("+ Tambah channel", "btn-accent w-full", () => openChannelForm(main, null)),
      el("div", { class: "pt-1" }, [
        el("div", { class: "flex items-center justify-between mb-2" }, [
          el("h2", { class: "font-bold text-lg", text: "Profit per channel" }),
        ]),
        el("p", { class: "text-xs text-gray-500 mb-2", text: "Pilih menu, atur harga per channel, lihat fee & profit bersih." }),
        menus.length ? channelAnalysis(menus) : el("p", { class: "text-sm text-gray-500", text: "Buat menu terlebih dahulu." }),
      ]),
    ])
  );
}

function channelCard(c) {
  const feeLine = `${num(c.commissionPercent)}% komisi` + (c.paymentFeePercent ? ` + ${num(c.paymentFeePercent)}% pay` : "") + (c.taxPercent ? ` + ${num(c.taxPercent)}% pajak` : "") + (c.marketingFeePercent ? ` + ${num(c.marketingFeePercent)}% market` : "") + (c.fixedFee ? ` + ${money(c.fixedFee)}` : "");
  return card([
    el("div", { class: "flex items-center justify-between" }, [
      el("h3", { class: "font-bold", text: c.name }),
      el("span", { class: "font-mono-kc text-sm", text: c.status === "inactive" ? "nonaktif" : "aktif" }),
    ]),
    el("p", { class: "text-xs text-gray-500 mt-1", text: feeLine }),
    el("div", { class: "flex items-center gap-2 mt-2" }, [
      btn("Edit", "text-xs btn-paper", () => openChannelForm(document.querySelector("main"), c)),
      btn("Hapus", "text-xs btn-paper", () => onDelete(c)),
    ]),
  ], "bg-white");
}

function onDelete(c) {
  if (!confirm(`Hapus channel ${c.name}?`)) return;
  const res = deleteChannel(c.id);
  if (!res.ok) return toast(res.errors.join(" · "), "bad");
  toast("Channel dihapus");
  renderChannel(document.querySelector("main"));
}

function sheet(children, title) {
  const overlay = el("div", { class: "fixed inset-0 bg-black/40 z-40", onclick: () => overlay.remove() });
  const panel = el("div", { class: "sheet max-h-[85dvh] overflow-auto" }, [
    el("div", { class: "flex items-center justify-between mb-3 sticky top-0 bg-[var(--paper)] z-10 pb-2" }, [
      el("h2", { class: "font-bold text-lg", text: title }),
      btn("Tutup", "text-xs btn-paper", () => overlay.remove()),
    ]),
    ...children,
  ]);
  overlay.append(panel);
  document.body.append(overlay);
  return { overlay, panel };
}

function openChannelForm(main, channel) {
  const isEdit = !!channel;
  const name = input({ value: channel?.name || "", placeholder: "mis. GoFood" });
  const fields = {
    commissionPercent: input({ type: "number", value: channel?.commissionPercent ?? "", min: 0, max: 100, step: "any" }),
    paymentFeePercent: input({ type: "number", value: channel?.paymentFeePercent ?? 0, min: 0, max: 100, step: "any" }),
    taxPercent: input({ type: "number", value: channel?.taxPercent ?? 0, min: 0, max: 100, step: "any" }),
    marketingFeePercent: input({ type: "number", value: channel?.marketingFeePercent ?? 0, min: 0, max: 100, step: "any" }),
    fixedFee: input({ type: "number", value: channel?.fixedFee ?? 0, min: 0, step: "any" }),
  };

  const { overlay } = sheet([
    fieldBlock("Nama channel", name),
    el("div", { class: "grid grid-cols-2 gap-2" }, [
      fieldBlock("Komisi %", fields.commissionPercent),
      fieldBlock("Payment fee %", fields.paymentFeePercent),
      fieldBlock("Pajak %", fields.taxPercent),
      fieldBlock("Marketing %", fields.marketingFeePercent),
    ]),
    fieldBlock("Fixed fee (Rp)", fields.fixedFee),
    btn(isEdit ? "Simpan channel" : "Tambah channel", "btn-accent w-full mt-2", () => {
      const data = {
        name: name.value,
        commissionPercent: fields.commissionPercent.value,
        paymentFeePercent: fields.paymentFeePercent.value,
        taxPercent: fields.taxPercent.value,
        marketingFeePercent: fields.marketingFeePercent.value,
        fixedFee: fields.fixedFee.value,
      };
      const res = isEdit ? updateChannel(channel.id, data) : addChannel(data);
      if (!res.ok) return toast(res.errors.join(" · "), "bad");
      overlay.remove();
      toast(isEdit ? "Channel diperbarui" : "Channel ditambahkan", "good");
      renderChannel(document.querySelector("main"));
    }),
  ], isEdit ? "Edit channel" : "Tambah channel");
}

function channelAnalysis(menus) {
  const s = getState();
  const menuSel = select(menus.map((m) => [m.id, m.name]), { value: menus[0].id });
  const host = el("div", { class: "space-y-3" });
  const body = el("div", { class: "space-y-2" });

  function renderBody() {
    body.replaceChildren();
    const menu = menus.find((m) => m.id === menuSel.value);
    if (!menu) return;
    const channelList = s.channels.filter((c) => c.status !== "inactive");
    for (const ch of channelList) {
      const price = input({ type: "number", value: getMenuPrice(menu.id, ch.id)?.sellingPrice ?? (ch.id === "CHN-000001" ? menu.sellingPrice : ""), min: 0, placeholder: "Harga" });
      const row = el("div", { class: "brutal-sm p-2 bg-white" }, [
        el("div", { class: "flex items-center justify-between mb-1" }, [
          el("span", { class: "font-bold text-sm", text: ch.name }), ],
        ),
        el("div", { class: "flex items-end gap-1.5" }, [
          el("div", { class: "flex-1" }, [price]),
          btn("Hitung", "text-xs btn-paper", () => {
            const v = Number(price.value);
            if (!(v > 0)) return toast("Harga harus lebih dari 0", "bad");
            setMenuPrice(menu.id, ch.id, v);
            const r = channelProfit(menu, ch.id);
            if (!r.ok) return toast(r.errors.join(" · "), "bad");
            price.value = v;
            toast("Fee & profit dihitung", "good");
          }),
        ]),
        resultLine(menu, ch.id),
      ]);
      body.append(row);
    }
  }

  function resultLine(menu, channelId) {
    const hook = el("div", { class: "mt-2 text-xs space-y-0.5" });
    const r = channelProfit(menu, channelId);
    if (r.ok) {
      hook.replaceChildren(
        el("div", { class: "flex justify-between" }, [el("span", { class: "text-gray-500", text: "Total fee" }), el("span", { class: "font-mono-kc font-bold", text: money(r.total) })]),
        el("div", { class: "flex justify-between" }, [el("span", { class: "text-gray-500", text: "Net revenue" }), el("span", { class: "font-mono-kc font-bold", text: money(r.netRevenue) })]),
        el("div", { class: "flex justify-between border-t border-ink/20 pt-0.5 mt-0.5" }, [el("span", { class: "font-semibold", text: "Profit (setelah fee & HPP)" }), el("span", { class: "font-mono-kc font-bold", text: money(r.profit) })]),
        el("div", { class: "flex justify-between" }, [el("span", { class: "text-gray-500", text: "Margin" }), el("span", { class: "font-mono-kc font-bold", text: r.marginNet != null ? pct(r.marginNet) : "—" })]),
        el("div", { class: "flex justify-between text-[0.6rem] text-gray-400" }, [el("span", {}, `fee: ${money(r.commission)} + ${money(r.paymentFee)} + ${money(r.tax)} + ${money(r.marketingFee)}${r.fixedFee ? " + " + money(r.fixedFee) : ""}`)]),
      );
    }
    return hook;
  }

  menuSel.addEventListener("change", renderBody);
  renderBody();
  return el("div", { class: "space-y-2" }, [fieldBlock("Menu", menuSel), body]);
}
