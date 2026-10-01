import { newId } from "../../db/store";
import { HttpError, created, notFound } from "../http";
import type { RouteDefinition } from "../router";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export const uploadRoutes: RouteDefinition[] = [
  [
    "POST",
    "/admin/uploads",
    async ({ req, db, auth }) => {
      auth.requireAdmin();
      const file = req.body instanceof FormData ? req.body.get("file") : null;
      if (!(file instanceof Blob)) {
        throw new HttpError(422, "VALIDATION_ERROR", "Expected multipart field \"file\"", [
          { field: "file", code: "required", message: "File is required" },
        ]);
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new HttpError(415, "UNSUPPORTED_MEDIA_TYPE", `Allowed types: ${ALLOWED_TYPES.join(", ")}`);
      }
      if (file.size > MAX_BYTES) throw new HttpError(413, "PAYLOAD_TOO_LARGE", "Images must be 5 MB or smaller");

      const id = newId("upl");
      db.uploads.set(id, { contentType: file.type, bytes: new Uint8Array(await file.arrayBuffer()) });
      return created({ id, url: `/api/v1/uploads/${id}`, contentType: file.type, size: file.size });
    },
  ],
  [
    "GET",
    "/uploads/:id",
    ({ db, params }) => {
      const upload = db.uploads.get(params.id!);
      if (!upload) throw notFound("File");
      return { status: 200, body: null, raw: { bytes: upload.bytes, contentType: upload.contentType } };
    },
  ],
];
