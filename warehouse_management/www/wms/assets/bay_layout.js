/* Floor layouts for the WMS Bay Stock screen. */
(function () {
  function rows(prefix, from, to) {
    var list = [];
    var step = from <= to ? 1 : -1;
    for (var n = from; step > 0 ? n <= to : n >= to; n += step) list.push(prefix + n);
    return list;
  }

  var UNITS = [
    {
      unit: "UNIT 1",
      company: "Jayashree Spun Bond",
      color: "#3b82f6",
      machine: "left",
      bays: rows("B", 1, 7),
      blocks: [{ cols: ["F", "L"], rows: rows("B", 1, 7) }]
    },
    {
      unit: "UNIT 2",
      company: "Jayashree Spun Bond",
      color: "#ef4444",
      machine: "top",
      bays: rows("A", 1, 21),
      blocks: [
        { cols: ["L", "F"], rows: rows("A", 15, 21) },
        { cols: ["F", "M1", "M2", "L"], rows: rows("A", 1, 14) }
      ]
    },
    {
      unit: "UNIT 3",
      company: "Jayashree Spun Bond",
      color: "#10b981",
      machine: "center",
      bays: rows("C", 1, 10),
      blocks: [
        { cols: ["L", "M2", "M1", "F"], rows: ["C10", "C9"] },
        { cols: ["F", "L"], rows: ["C8", "C7", "C6"], before: ["STACKER", "RT-2"], after: ["RT-1"] },
        { rackCols: ["C5", "C4", "C3", "C2", "C1"], posRows: ["F", "M1", "M2", "L"] }
      ]
    },
    {
      unit: "UNIT 4",
      company: "Jayashree Spun Bond",
      color: "#f59e0b",
      machine: "left",
      bays: rows("D", 1, 8),
      blocks: [{ cols: ["F", "L"], rows: rows("D", 1, 8) }]
    },
    {
      unit: "COMMON",
      company: "",
      color: "#6366f1",
      machine: "none",
      plain: true,
      bays: ["JC", "TC"],
      blocks: []
    }
  ];

  function positionsFor(rack) {
    if (rack === "JC" || rack === "TC") return ["X"];
    var m = String(rack || "").match(/^([A-Z]+)(\d+)$/);
    if (!m) return ["F", "L"];
    var prefix = m[1];
    var num = parseInt(m[2], 10);
    if (prefix === "B" || prefix === "D") return ["F", "L"];
    if (prefix === "A") return num >= 15 ? ["L", "F"] : ["F", "M1", "M2", "L"];
    if (prefix === "C") {
      if (num >= 6 && num <= 8) return ["F", "L"];
      if (num >= 9) return ["L", "M2", "M1", "F"];
      return ["F", "M1", "M2", "L"];
    }
    return ["F", "L"];
  }

  function emptyRack(rack) {
    var pos = positionsFor(rack);
    var levels = {};
    ["L1", "L2", "L3"].forEach(function (level) {
      levels[level] = {};
      pos.forEach(function (p) { levels[level][p] = []; });
    });
    return levels;
  }

  function parseBay(raw) {
    var name = raw || "";
    var common = name.match(/^(JC|TC)-(L\d)$/);
    if (common) return { rack: common[1], position: "X", level: common[2], parsed: true };
    if (name === "JC" || name === "TC") return { rack: name, position: "X", level: "L1", parsed: true };
    var slot = name.match(/^([A-Za-z]+\d*)-(F|L|M1|M2|M)-(L\d+)$/);
    if (slot) {
      return {
        rack: slot[1],
        position: slot[2] === "M" ? "M1" : slot[2],
        level: slot[3],
        parsed: true
      };
    }
    return { rack: name || "UNASSIGNED", position: "X", level: "L1", parsed: false };
  }

  function slotName(rack, pos, level) {
    if (rack === "JC" || rack === "TC") return rack + "-" + level;
    return rack + "-" + pos + "-" + level;
  }

  function slotLabel(rack, pos, level) {
    if (rack === "JC" || rack === "TC") return rack + "-" + level;
    return pos + "-" + level;
  }

  function cellCount(counts, rack, pos) {
    var rackData = counts && counts.get ? counts.get(rack) : null;
    if (!rackData) return 0;
    var total = 0;
    ["L1", "L2", "L3"].forEach(function (level) {
      var bucket = rackData[level] && rackData[level][pos];
      if (bucket) total += bucket.length;
    });
    return total;
  }

  function rackCount(counts, rack) {
    return positionsFor(rack).reduce(function (sum, pos) {
      return sum + cellCount(counts, rack, pos);
    }, 0);
  }

  function paint(count, selected) {
    if (selected) return { background: "#1e293b", borderColor: "#1e293b", color: "#fff" };
    if (count >= 16) return { background: "#fff1f2", borderColor: "#fda4af", color: "#9f1239" };
    if (count >= 6) return { background: "#fffbeb", borderColor: "#fcd34d", color: "#92400e" };
    if (count > 0) return { background: "#ecfdf5", borderColor: "#6ee7b7", color: "#065f46" };
    return { background: "#fff", borderColor: "#cbd5e1", color: "#334155" };
  }

  function cellButton(j, opts) {
    var look = paint(opts.count, opts.selected);
    var label = opts.pos === "X" ? opts.rack : opts.rack + "-" + opts.pos;
    if (opts.rack === "JC") label = "JC";
    if (opts.rack === "TC") label = "TC";
    return j.jsxs("button", {
      onClick: function () { opts.onPick(opts.rack); },
      title: opts.rack === "JC" ? "Jayashree Common" : opts.rack === "TC" ? "Thusmaa Common" : label,
      style: {
        minWidth: opts.pos === "X" ? 150 : 72,
        height: opts.pos === "X" ? 64 : 36,
        padding: "2px 6px",
        border: "1px solid " + look.borderColor,
        background: look.background,
        color: look.color,
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 700,
        cursor: "pointer",
        position: "relative"
      },
      children: [
        label,
        opts.count > 0 ? j.jsx("span", {
          style: {
            position: "absolute",
            right: 3,
            bottom: 2,
            background: "#0f172a",
            color: "#fff",
            borderRadius: 99,
            fontSize: 9,
            minWidth: 14,
            padding: "0 3px"
          },
          children: String(opts.count)
        }) : null
      ]
    }, opts.rack + "-" + opts.pos);
  }

  function blockTable(j, block, ctx) {
    if (block.rackCols) {
      return j.jsxs("table", {
        style: { borderCollapse: "collapse" },
        children: block.posRows.map(function (pos) {
          return j.jsx("tr", {
            children: block.rackCols.map(function (rack) {
              return j.jsx("td", { style: { padding: 2 }, children: cellButton(j, {
                rack: rack, pos: pos, count: cellCount(ctx.counts, rack, pos),
                selected: ctx.selected === rack, onPick: ctx.setSelected
              }) }, rack + pos);
            })
          }, pos);
        })
      });
    }
    var rowsOut = [];
    (block.before || []).forEach(function (label) {
      rowsOut.push(j.jsx("div", {
        style: { border: "1px solid #94a3b8", textAlign: "center", fontSize: 11, fontWeight: 800, padding: "6px 8px", marginBottom: 2, background: "#f8fafc" },
        children: label
      }, label));
    });
    rowsOut.push(j.jsx("table", {
      style: { borderCollapse: "collapse" },
      children: block.rows.map(function (rack) {
        return j.jsx("tr", {
          children: block.cols.map(function (pos) {
            return j.jsx("td", { style: { padding: 2 }, children: cellButton(j, {
              rack: rack, pos: pos, count: cellCount(ctx.counts, rack, pos),
              selected: ctx.selected === rack, onPick: ctx.setSelected
            }) }, rack + pos);
          })
        }, rack);
      })
    }));
    (block.after || []).forEach(function (label) {
      rowsOut.push(j.jsx("div", {
        style: { border: "1px solid #94a3b8", textAlign: "center", fontSize: 11, fontWeight: 800, padding: "6px 8px", marginTop: 2, background: "#f8fafc" },
        children: label
      }, "after-" + label));
    });
    return j.jsx("div", { children: rowsOut });
  }

  function plainArea(j, rack) {
    var title = rack === "JC" ? "Jayashree Common" : "Thusmaa Common";
    return j.jsxs("div", {
      title: title,
      style: {
        width: 240,
        height: 130,
        border: "1px dashed #94a3b8",
        background: "#f8fafc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 4,
        color: "#334155"
      },
      children: [
        j.jsx("div", { style: { fontWeight: 800, fontSize: 18 }, children: rack }),
        j.jsx("div", { style: { fontSize: 11, color: "#64748b" }, children: title })
      ]
    }, rack);
  }

  function renderFloor(j, ctx) {
    return j.jsx("div", {
      style: { padding: 24, background: "#f8fafc", display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "center", minHeight: 600 },
      children: ctx.units.map(function (unit) {
        var heading = unit.unit === "COMMON" ? "COMMON" : unit.unit + " — " + unit.company + "  ·  open 3D";
        var body;
        if (unit.plain) {
          body = j.jsx("div", {
            style: { display: "flex", flexDirection: "column", gap: 16, alignItems: "center" },
            children: unit.bays.map(function (rack) { return plainArea(j, rack); })
          });
        } else if (unit.unit === "UNIT 3") {
          body = j.jsxs("div", {
            style: { display: "flex", flexDirection: "column", gap: 16, alignItems: "center" },
            children: [
              blockTable(j, unit.blocks[0], ctx),
              j.jsxs("div", { style: { display: "flex", gap: 28, alignItems: "center" }, children: [
                machineNode(j),
                blockTable(j, unit.blocks[1], ctx)
              ]}),
              blockTable(j, unit.blocks[2], ctx)
            ]
          });
        } else if (unit.machine === "top") {
          body = j.jsxs("div", {
            style: { display: "flex", flexDirection: "column", gap: 18, alignItems: "center", width: "100%" },
            children: [
              machineNode(j),
              j.jsx("div", {
                style: { display: "flex", gap: 28, alignItems: "flex-start", justifyContent: "center" },
                children: unit.blocks.map(function (block, idx) {
                  return j.jsx("div", { children: blockTable(j, block, ctx) }, idx);
                })
              })
            ]
          });
        } else {
          var row = [];
          if (unit.machine === "left") row.push(machineNode(j));
          row.push(j.jsx("div", {
            style: { display: "flex", gap: 28, alignItems: "flex-start" },
            children: unit.blocks.map(function (block, idx) {
              return j.jsx("div", { children: blockTable(j, block, ctx) }, idx);
            })
          }, "racks"));
          body = j.jsx("div", { style: { display: "flex", gap: 24, alignItems: "center" }, children: row });
        }
        return j.jsxs("div", {
          style: { border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8, padding: 16, boxShadow: "0 1px 2px rgba(0,0,0,.04)" },
          children: [
            j.jsx("button", {
              onClick: function () { if (!unit.plain) ctx.setSelected("UNIT::" + unit.unit); },
              style: { display: "block", width: "100%", marginBottom: 14, border: 0, background: "transparent", color: unit.color, fontSize: 12, fontWeight: 800, cursor: unit.plain ? "default" : "pointer", textAlign: "center", whiteSpace: "nowrap" },
              children: heading
            }),
            body
          ]
        }, unit.unit);
      })
    });
  }

  function machineNode(j) {
    return j.jsx("div", {
      style: {
        width: 110,
        height: 110,
        border: "2px solid #0f172a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        background: "#fff",
        flexShrink: 0
      },
      children: "Machine"
    }, "machine");
  }

  function sceneFloor(j, unit, ctx) {
    var tables = unit.blocks.map(function (block, idx) {
      return j.jsx("div", {
        children: blockTable(j, block, { counts: ctx.counts, selected: null, setSelected: ctx.setSelected })
      }, idx);
    });
    var machine = j.jsx("div", {
      style: {
        width: 140, height: 140, background: "#1e293b", border: "2px solid #38bdf8",
        display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800,
        boxShadow: "0 18px 0 #020617", flexShrink: 0
      },
      children: "Machine"
    });
    if (unit.unit === "UNIT 3") {
      return j.jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 22, alignItems: "center" }, children: [
        tables[0],
        j.jsxs("div", { style: { display: "flex", gap: 28, alignItems: "center" }, children: [machine, tables[1]] }),
        tables[2]
      ]});
    }
    if (unit.machine === "left") {
      return j.jsxs("div", { style: { display: "flex", gap: 36, alignItems: "center" }, children: [machine, tables] });
    }
    if (unit.machine === "top") {
      return j.jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 22, alignItems: "center" }, children: [
        machine,
        j.jsx("div", { style: { display: "flex", gap: 36 }, children: tables })
      ]});
    }
    return j.jsx("div", { style: { display: "flex", gap: 36 }, children: tables });
  }

  function renderUnit3D(j, ctx) {
    var unit = (ctx.units || []).filter(function (u) { return u.unit === ctx.unitId; })[0];
    if (!unit) return j.jsx("div", { children: "Unknown unit" });
    return j.jsxs("div", {
      style: { padding: 16, background: "#0f172a", minHeight: 640, color: "#e2e8f0" },
      children: [
        j.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }, children: [
          j.jsxs("div", { children: [
            j.jsx("div", { style: { fontWeight: 800, fontSize: 18 }, children: unit.unit + " floor" }),
            j.jsx("div", { style: { fontSize: 12, color: "#94a3b8" }, children: "Machine and bays. Click a bay to open that rack." })
          ]}),
          j.jsx("button", {
            onClick: function () { ctx.setSelected(null); },
            style: { background: "#1e293b", color: "#fff", border: "1px solid #334155", borderRadius: 6, padding: "6px 10px", cursor: "pointer" },
            children: "Back to all units"
          })
        ]}),
        j.jsx("div", {
          style: { perspective: "1400px", minHeight: 560, display: "flex", alignItems: "center", justifyContent: "center", overflow: "auto" },
          children: j.jsx("div", {
            style: { transform: "rotateX(58deg) rotateZ(-18deg)", transformStyle: "preserve-3d" },
            children: sceneFloor(j, unit, ctx)
          })
        })
      ]
    });
  }

  window.WMS_UNITS = UNITS;
  window.WMS_POS = positionsFor;
  window.WMS_EMPTY = emptyRack;
  window.WMS_PARSE = parseBay;
  window.WMS_SLOT_NAME = slotName;
  window.WMS_SLOT_LABEL = slotLabel;
  window.WMS_FLOOR = renderFloor;
  window.WMS_UNIT3D = renderUnit3D;
  window.WMS_LEVEL_LAYERS = function () {
    return [{ level: "L1", z: 0 }, { level: "L2", z: 130 }, { level: "L3", z: 260 }];
  };
})();
