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

  var SCENE_X = 56;
  var SCENE_Z = -18;

  function levelCount(counts, rack, pos, level) {
    var rackData = counts && counts.get ? counts.get(rack) : null;
    var bucket = rackData && rackData[level] && rackData[level][pos];
    return bucket ? bucket.length : 0;
  }

  function face(j, style, children, key) {
    return j.jsx("div", {
      style: Object.assign({ position: "absolute", transformStyle: "preserve-3d" }, style),
      children: children || null
    }, key);
  }

  function slab(j, spec) {
    var w = spec.w;
    var d = spec.d;
    var h = spec.h;
    return j.jsxs("div", {
      style: {
        position: "absolute",
        left: spec.x || 0,
        top: spec.y || 0,
        width: w,
        height: d,
        transformStyle: "preserve-3d",
        transform: "translateZ(" + (spec.z || 0) + "px)"
      },
      children: [
        face(j, { left: 0, top: 0, width: w, height: d, background: spec.top, border: "1px solid rgba(255,255,255,.28)", transform: "translateZ(" + h + "px)" }, null, "top"),
        face(j, {
          left: 0, top: d, width: w, height: h, background: spec.front,
          transformOrigin: "left top", transform: "rotateX(-90deg)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#f8fafc", fontWeight: 800, fontSize: 11, letterSpacing: 0.4
        }, spec.label || null, "front"),
        face(j, {
          left: w, top: 0, width: h, height: d, background: spec.side,
          transformOrigin: "left top", transform: "rotateY(-90deg)"
        }, null, "side")
      ]
    }, spec.key || "slab");
  }

  function machine3d(j) {
    return j.jsxs("div", {
      style: { position: "relative", width: 168, height: 96, transformStyle: "preserve-3d", flexShrink: 0 },
      children: [
        face(j, {
          left: 8, top: 18, width: 150, height: 62,
          background: "radial-gradient(ellipse at center, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 72%)",
          transform: "translateZ(-6px)"
        }, null, "shadow"),
        slab(j, { key: "base", x: 0, y: 8, z: 0, w: 168, d: 78, h: 12, top: "#334155", front: "#1e293b", side: "#0f172a" }),
        slab(j, { key: "body", x: 28, y: 18, z: 12, w: 96, d: 52, h: 46, top: "#7dd3fc", front: "#0284c7", side: "#075985", label: "MACHINE" }),
        slab(j, { key: "hopper", x: 52, y: 28, z: 58, w: 40, d: 30, h: 26, top: "#fde68a", front: "#d97706", side: "#b45309" }),
        slab(j, { key: "feed", x: 8, y: 30, z: 12, w: 22, d: 34, h: 28, top: "#cbd5e1", front: "#64748b", side: "#475569" }),
        slab(j, { key: "winder", x: 124, y: 22, z: 12, w: 32, d: 44, h: 36, top: "#e2e8f0", front: "#94a3b8", side: "#64748b" }),
        slab(j, { key: "roll1", x: 36, y: 70, z: 14, w: 18, d: 14, h: 14, top: "#f8fafc", front: "#cbd5e1", side: "#94a3b8" }),
        slab(j, { key: "roll2", x: 58, y: 70, z: 14, w: 18, d: 14, h: 14, top: "#f8fafc", front: "#cbd5e1", side: "#94a3b8" }),
        slab(j, { key: "roll3", x: 80, y: 70, z: 14, w: 18, d: 14, h: 14, top: "#f8fafc", front: "#cbd5e1", side: "#94a3b8" })
      ]
    });
  }

  function rack3d(j, rack, positions, ctx) {
    var cell = 28;
    var depth = 26;
    var postH = 58;
    var w = Math.max(positions.length, 1) * cell;
    var levels = ["L1", "L2", "L3"];
    var posts = [
      { left: -4, top: -4 },
      { left: w - 3, top: -4 },
      { left: -4, top: depth - 3 },
      { left: w - 3, top: depth - 3 }
    ].map(function (corner, idx) {
      return j.jsx("div", {
        style: Object.assign({ position: "absolute", width: 6, height: 6, background: "#334155", transformStyle: "preserve-3d" }, corner),
        children: j.jsx("div", {
          style: {
            position: "absolute", width: 6, height: postH,
            background: "linear-gradient(90deg,#cbd5e1,#475569)",
            transformOrigin: "top left",
            transform: "rotateX(-90deg) translateY(-" + postH + "px)",
            boxShadow: "1px 0 0 #0f172a"
          }
        })
      }, "post" + idx);
    });
    var shelves = levels.map(function (level, idx) {
      var z = 8 + idx * 18;
      return j.jsx("div", {
        style: {
          position: "absolute", left: 0, top: 0, width: w, height: depth,
          transform: "translateZ(" + z + "px)",
          transformStyle: "preserve-3d",
          display: "flex",
          background: "rgba(15,23,42,.72)",
          border: "1px solid #64748b",
          boxShadow: "inset 0 0 8px rgba(0,0,0,.35)"
        },
        children: positions.map(function (pos) {
          var count = levelCount(ctx.counts, rack, pos, level);
          var look = paint(count, false);
          return j.jsxs("div", {
            style: {
              flex: 1,
              background: count ? look.background : "rgba(30,41,59,.35)",
              borderRight: "1px solid rgba(148,163,184,.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: count ? look.color : "#cbd5e1",
              fontSize: 8,
              fontWeight: 800
            },
            children: [idx === 2 ? pos : "", count ? j.jsx("span", { style: { marginLeft: 2 }, children: String(count) }) : null]
          }, rack + pos + level);
        })
      }, level);
    });
    return j.jsxs("div", {
      onClick: function () { ctx.setSelected(rack); },
      title: rack,
      style: { position: "relative", width: w, height: depth, transformStyle: "preserve-3d", cursor: "pointer" },
      children: posts.concat(shelves).concat([
        j.jsx("div", {
          style: {
            position: "absolute",
            left: "50%",
            top: depth + 8,
            transform: "translateX(-50%) rotateZ(" + (-SCENE_Z) + "deg) rotateX(" + (-SCENE_X) + "deg)",
            transformOrigin: "center center",
            color: "#f8fafc",
            fontWeight: 800,
            fontSize: 12,
            letterSpacing: 0.6,
            whiteSpace: "nowrap",
            textShadow: "0 2px 6px rgba(0,0,0,.9)"
          },
          children: rack
        }, "name")
      ])
    }, rack);
  }

  function sign3d(j, label) {
    return j.jsx("div", {
      style: { position: "relative", width: 72, height: 18, transformStyle: "preserve-3d", margin: "4px 0" },
      children: slab(j, {
        key: label, x: 0, y: 0, z: 0, w: 72, d: 18, h: 16,
        top: "#e2e8f0", front: "#f8fafc", side: "#cbd5e1", label: label
      })
    }, label);
  }

  function blockRacks(j, block, ctx) {
    var names = block.rackCols || block.rows || [];
    var positions = block.rackCols ? block.posRows : block.cols;
    var parts = [];
    (block.before || []).forEach(function (label) { parts.push(sign3d(j, label)); });
    names.forEach(function (rack) { parts.push(rack3d(j, rack, positions, ctx)); });
    (block.after || []).forEach(function (label) { parts.push(sign3d(j, label)); });
    return j.jsx("div", {
      style: { display: "flex", flexDirection: "column", gap: 18, alignItems: "center", transformStyle: "preserve-3d" },
      children: parts
    });
  }

  function sceneFloor(j, unit, ctx) {
    var groups = (unit.blocks || []).map(function (block, idx) {
      return j.jsx("div", { style: { transformStyle: "preserve-3d" }, children: blockRacks(j, block, ctx) }, idx);
    });
    var machine = machine3d(j);
    var stage = { display: "flex", gap: 42, alignItems: "center", transformStyle: "preserve-3d" };
    if (unit.unit === "UNIT 3") {
      return j.jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 28, alignItems: "center", transformStyle: "preserve-3d" }, children: [
        groups[0],
        j.jsxs("div", { style: stage, children: [machine, groups[1]] }),
        groups[2]
      ]});
    }
    if (unit.machine === "left") {
      return j.jsxs("div", { style: stage, children: [machine, groups] });
    }
    if (unit.machine === "top") {
      return j.jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 34, alignItems: "center", transformStyle: "preserve-3d" }, children: [
        machine,
        j.jsx("div", { style: { display: "flex", gap: 36, alignItems: "flex-start", transformStyle: "preserve-3d" }, children: groups })
      ]});
    }
    return j.jsx("div", { style: stage, children: groups });
  }

  function renderUnit3D(j, ctx) {
    var unit = (ctx.units || []).filter(function (u) { return u.unit === ctx.unitId; })[0];
    if (!unit) return j.jsx("div", { children: "Unknown unit" });
    var scale = (unit.bays || []).length > 16 ? 0.72 : 1;
    return j.jsxs("div", {
      style: { padding: 16, background: "#0f172a", minHeight: 640, color: "#e2e8f0" },
      children: [
        j.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }, children: [
          j.jsxs("div", { children: [
            j.jsx("div", { style: { fontWeight: 800, fontSize: 18 }, children: unit.unit + " floor" }),
            j.jsx("div", { style: { fontSize: 12, color: "#94a3b8" }, children: "Click a rack to open that bay." })
          ]}),
          j.jsx("button", {
            onClick: function () { ctx.setSelected(null); },
            style: { background: "#1e293b", color: "#fff", border: "1px solid #334155", borderRadius: 6, padding: "6px 10px", cursor: "pointer" },
            children: "Back to all units"
          })
        ]}),
        j.jsx("div", {
          style: { minHeight: 560, overflow: "auto" },
          children: j.jsx("div", {
            style: { perspective: "1600px", minHeight: 620, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" },
            children: j.jsxs("div", {
              style: {
                position: "relative",
                transform: "rotateX(" + SCENE_X + "deg) rotateZ(" + SCENE_Z + "deg) scale(" + scale + ")",
                transformStyle: "preserve-3d"
              },
              children: [
                j.jsx("div", {
                  style: {
                    position: "absolute", left: "50%", top: "50%", width: 980, height: 720,
                    marginLeft: -490, marginTop: -360,
                    background: "radial-gradient(ellipse at center, rgba(51,65,85,.45) 0%, rgba(15,23,42,0) 68%)",
                    transform: "translateZ(-16px)", pointerEvents: "none"
                  }
                }),
                sceneFloor(j, unit, ctx)
              ]
            })
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
