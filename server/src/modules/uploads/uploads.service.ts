import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import sharp, { FormatEnum } from 'sharp';
import { fromBuffer } from 'file-type';
import { S3StorageService } from './s3-storage.service';
import { Errors } from '../../common/exceptions/app.exception';

const ALLOWED_MIME_TO_SHARP_FORMAT: Record<string, keyof FormatEnum> = {
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};
const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

export interface UploadResult {
  id: string;
  url: string;
  contentType: string;
  size: number;
}

@Injectable()
export class UploadsService {
  constructor(private readonly storage: S3StorageService) {}

  async uploadImage(file: Express.Multer.File | undefined): Promise<UploadResult> {
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw Errors.validation([{ field: 'file', code: 'required', message: 'File is required' }]);
    }

    // Trust the file's actual magic bytes, not the client-supplied Content-Type.
    const detected = await fromBuffer(file.buffer);
    const sharpFormat = detected ? ALLOWED_MIME_TO_SHARP_FORMAT[detected.mime] : undefined;
    if (!detected || !sharpFormat) {
      throw Errors.unsupportedMediaType();
    }

    let processed: Buffer;
    try {
      processed = await sharp(file.buffer).rotate().toFormat(sharpFormat).toBuffer();
    } catch {
      throw Errors.unsupportedMediaType('The uploaded file is not a valid image');
    }

    const id = randomUUID();
    const key = `uploads/${id}.${EXT_BY_MIME[detected.mime]}`;
    const url = await this.storage.upload(key, processed, detected.mime);

    return { id, url, contentType: detected.mime, size: file.size };
  }
}
