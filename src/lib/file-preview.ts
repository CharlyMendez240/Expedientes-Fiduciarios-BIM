const PREVIEW_TYPES = [
  { mime: "application/pdf", test: (bytes: Buffer) => bytes.subarray(0, 5).toString("latin1") === "%PDF-" },
  { mime: "image/png", test: (bytes: Buffer) => bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { mime: "image/jpeg", test: (bytes: Buffer) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  { mime: "image/gif", test: (bytes: Buffer) => bytes.subarray(0, 6).toString("latin1") === "GIF87a" || bytes.subarray(0, 6).toString("latin1") === "GIF89a" },
  { mime: "image/webp", test: (bytes: Buffer) => bytes.subarray(0, 4).toString("latin1") === "RIFF" && bytes.subarray(8, 12).toString("latin1") === "WEBP" },
];

export function filePreviewResponse(fileName: string, bytes: Buffer) {
  const mime = PREVIEW_TYPES.find((type) => bytes.length >= 12 && type.test(bytes))?.mime;
  const cleaned = fileName.replace(/[\r\n]/g, "").replace(/[/\\]/g, "").slice(0, 180) || "archivo";
  const ascii = cleaned.replace(/[^\x20-\x7E]/g, "_").replaceAll('"', "");
  const disposition = mime
    ? `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(cleaned)}`
    : `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(cleaned)}`;
  const headers: Record<string, string> = {
    "Content-Type": mime ?? "application/octet-stream",
    "Content-Disposition": disposition,
    "X-Content-Type-Options": "nosniff",
  };
  if (!mime) headers["Content-Security-Policy"] = "sandbox; default-src 'none'";
  return new Response(new Uint8Array(bytes), { headers });
}
