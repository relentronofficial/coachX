import { describe, expect, it } from 'vitest';
import {
  ACCEPTED_IMAGE, AVATAR_MAX_MB, UPLOAD_MAX_MB, safeFileName, validateImage, validateUpload,
} from '@/lib/storage';

/** Minimal File stand-in — jsdom isn't loaded for these unit tests. */
function fakeFile(name: string, type: string, bytes: number): File {
  return { name, type, size: bytes } as File;
}
const MB = 1024 * 1024;

describe('avatar validation', () => {
  it('accepts every supported image type', () => {
    for (const type of ACCEPTED_IMAGE) {
      expect(validateImage(fakeFile('a.img', type, 1024)), type).toBeNull();
    }
  });

  it('rejects non-images with a message naming the accepted types', () => {
    const msg = validateImage(fakeFile('script.js', 'text/javascript', 100));
    expect(msg).toMatch(/PNG, JPEG, WebP or GIF/);
  });

  it('rejects an unknown mime type rather than assuming it is fine', () => {
    expect(validateImage(fakeFile('mystery', '', 100))).toMatch(/unknown/);
  });

  it('rejects images over the size cap and states the actual size', () => {
    const msg = validateImage(fakeFile('big.png', 'image/png', 6 * MB));
    expect(msg).toMatch(/under 5MB/);
    expect(msg).toMatch(/6\.0MB/);
  });

  it('accepts a file exactly at the cap', () => {
    expect(validateImage(fakeFile('edge.png', 'image/png', AVATAR_MAX_MB * MB))).toBeNull();
  });

  it('honours a custom cap', () => {
    expect(validateImage(fakeFile('a.png', 'image/png', 2 * MB), 1)).toMatch(/under 1MB/);
  });
});

describe('generic upload validation', () => {
  it('accepts an ordinary file', () => {
    expect(validateUpload(fakeFile('notes.txt', 'text/plain', 2048))).toBeNull();
  });

  it('rejects an empty file', () => {
    expect(validateUpload(fakeFile('empty.txt', 'text/plain', 0))).toMatch(/empty/);
  });

  it('rejects files over the cap', () => {
    expect(validateUpload(fakeFile('huge.zip', 'application/zip', (UPLOAD_MAX_MB + 1) * MB))).toMatch(/under 20MB/);
  });

  it('does not restrict by type — any file may go to private storage', () => {
    expect(validateUpload(fakeFile('a.exe', 'application/octet-stream', 10))).toBeNull();
  });
});

describe('safeFileName', () => {
  it('strips characters that would break or traverse a storage path', () => {
    expect(safeFileName('../../etc/passwd')).not.toContain('/');
    expect(safeFileName('../../etc/passwd')).not.toContain('..');
    expect(safeFileName('my file (1).png')).toBe('my_file_1_.png');
  });

  it('collapses runs of underscores', () => {
    expect(safeFileName('a###b')).toBe('a_b');
  });

  it('keeps ordinary names intact', () => {
    expect(safeFileName('report-2024_final.pdf')).toBe('report-2024_final.pdf');
  });

  it('caps the length so a path can never be unbounded', () => {
    expect(safeFileName('x'.repeat(500)).length).toBeLessThanOrEqual(80);
  });

  it('never returns an empty string', () => {
    expect(safeFileName('///')).toBe('file');
    expect(safeFileName('')).toBe('file');
  });
});
