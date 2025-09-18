import { ObjectId } from "mongodb";

export function toObjectId(id) {
  if (!id) return null;
  try {
    // accept raw string, trimmed, or already-ObjectId
    if (id instanceof ObjectId) return id;
    if (typeof id === "string") return new ObjectId(id.trim());
    // accept { _id: "..." } shape just in case
    if (typeof id === "object" && id._id) return new ObjectId(String(id._id).trim());
  } catch (_) {
    return null;
  }
  return null;
}
