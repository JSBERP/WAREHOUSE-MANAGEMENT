import frappe

LEVELS = ["L1", "L2", "L3"]

def positions_for(rack):
    if rack in ("JC", "TC"):
        return []
    prefix = "".join(ch for ch in rack if ch.isalpha())
    number = int("".join(ch for ch in rack if ch.isdigit()))
    if prefix in ("B", "D"):
        return ["F", "L"]
    if prefix == "A":
        return ["L", "F"] if number >= 15 else ["F", "M1", "M2", "L"]
    if prefix == "C":
        if 6 <= number <= 8:
            return ["F", "L"]
        if number >= 9:
            return ["L", "M2", "M1", "F"]
        return ["F", "M1", "M2", "L"]
    return ["F", "L"]

UNITS = {
    "UNIT 1": [f"B{n}" for n in range(1, 8)],
    "UNIT 2": [f"A{n}" for n in range(1, 22)],
    "UNIT 3": [f"C{n}" for n in range(1, 11)],
    "UNIT 4": [f"D{n}" for n in range(1, 9)],
    "COMMON": ["JC", "TC"],
}

COMMON_LABELS = {
    "JC": "Jayashree Common",
    "TC": "Thusmaa Common",
}

def create_all_bays():
    created = 0
    skipped = 0
    for unit, racks in UNITS.items():
        for rack in racks:
            if rack in ("JC", "TC"):
                names = [f"{rack}-{level}" for level in LEVELS]
                description = COMMON_LABELS[rack]
            else:
                names = [
                    f"{rack}-{pos}-{level}"
                    for level in LEVELS
                    for pos in positions_for(rack)
                ]
                description = unit
            for slot_name in names:
                if frappe.db.exists("Warehouse Bay", slot_name):
                    skipped += 1
                    continue
                doc = frappe.new_doc("Warehouse Bay")
                doc.bay_name = slot_name
                if rack in ("JC", "TC"):
                    doc.description = f"{description} | {slot_name}"
                else:
                    pos = slot_name.split("-")[1]
                    level = slot_name.split("-")[2]
                    doc.description = f"{unit} | Rack {rack} | Position {pos} | Level {level}"
                doc.insert(ignore_permissions=True)
                created += 1

    frappe.db.commit()
    print(f"Done! Created {created} bays, skipped {skipped} existing.")

create_all_bays()
