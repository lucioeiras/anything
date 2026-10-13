import { LocalModelManager } from '@/lib/ai/localModelManager';
import type { LocalModelConfig } from '@/lib/ai/types';

const mockDownloadAsync = jest.fn();
const mockCancel = jest.fn();
const mockFile = {
  exists: false,
  size: 0,
  delete: jest.fn(() => {
    mockFile.exists = false;
  }),
};

jest.mock('expo-file-system', () => ({
  Directory: jest.fn().mockImplementation(() => ({ exists: true, create: jest.fn() })),
  DownloadTask: jest.fn().mockImplementation(() => ({
    downloadAsync: mockDownloadAsync,
    cancel: mockCancel,
  })),
  File: jest.fn().mockImplementation(() => mockFile),
  Paths: { document: 'document' },
}));

const modelConfig: LocalModelConfig = {
  id: 'test-model',
  name: 'Test Model',
  displayName: 'Test Model',
  description: 'Test model',
  fileName: 'test-model.bin',
  downloadUrl: 'https://example.com/test-model.bin',
  sizeBytes: 10_000_000,
  sizeFormatted: '~10 MB',
};

describe('LocalModelManager', () => {
  beforeEach(() => {
    mockDownloadAsync.mockReset();
    mockCancel.mockReset();
    mockFile.exists = false;
    mockFile.size = 0;
    mockFile.delete.mockClear();
  });

  it('treats a user-cancelled download as a normal result and removes the partial file', async () => {
    let rejectDownload!: (error: Error) => void;
    mockDownloadAsync.mockImplementation(
      () =>
        new Promise((_, reject) => {
          rejectDownload = reject;
        })
    );
    mockCancel.mockImplementation(() => {
      rejectDownload(
        Object.assign(new Error('Download was cancelled'), { name: 'DownloadCancelledException' })
      );
    });

    const manager = new LocalModelManager(modelConfig);
    const download = manager.downloadModel();
    mockFile.exists = true;
    manager.cancelDownload();
    expect(manager.getProgress().isDownloading).toBe(true);

    await expect(download).resolves.toBeNull();
    expect(mockFile.delete).toHaveBeenCalledTimes(1);
    expect(manager.getProgress()).toMatchObject({
      isDownloading: false,
      progress: 0,
      bytesWritten: 0,
      totalBytes: 0,
      error: null,
    });
  });
});
