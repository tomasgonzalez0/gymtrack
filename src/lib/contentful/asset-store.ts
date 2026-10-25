export type UploadInput={bytes:Uint8Array;fileName:string;contentType:string;title:string}; export type StoredAsset={id:string;url:string;width:number;height:number;sizeBytes:number};
export interface AssetStore{upload(input:UploadInput):Promise<StoredAsset>;delete(id:string):Promise<void>}
