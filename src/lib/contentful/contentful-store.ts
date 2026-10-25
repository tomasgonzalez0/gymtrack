import "server-only";
import { createClient } from "contentful-management";
import type { AssetStore, UploadInput } from "./asset-store";
export class ContentfulAssetStore implements AssetStore {
  constructor(private token: string, private spaceId: string, private environmentId = "master") {}
  private async environment() {
    const client = createClient({ accessToken: this.token }, { type: "legacy" });
    return (await client.getSpace(this.spaceId)).getEnvironment(this.environmentId);
  }
  async upload(input: UploadInput) {
    const env = await this.environment();
    const upload = await env.createUpload({ file: Uint8Array.from(input.bytes).buffer });
    let asset = await env.createAsset({ fields: { title: { "en-US": input.title }, file: { "en-US": { fileName: input.fileName, contentType: input.contentType, uploadFrom: { sys: { type: "Link", linkType: "Upload", id: upload.sys.id } } } } } });
    asset = await asset.processForAllLocales();
    const deadline = Date.now() + 20_000;
    while (!asset.fields.file?.["en-US"]?.url && Date.now() < deadline) { await new Promise((resolve) => setTimeout(resolve, 750)); asset = await env.getAsset(asset.sys.id); }
    if (!asset.fields.file?.["en-US"]?.url) throw new Error("Contentful no procesó el asset a tiempo.");
    asset = await asset.publish();
    const file = asset.fields.file["en-US"];
    return { id: asset.sys.id, url: `https:${file.url}`, width: file.details?.image?.width ?? 0, height: file.details?.image?.height ?? 0, sizeBytes: file.details?.size ?? input.bytes.byteLength };
  }
  async delete(id: string) { const env = await this.environment(); const asset = await env.getAsset(id); if (asset.isPublished()) await asset.unpublish(); await asset.delete(); }
}
