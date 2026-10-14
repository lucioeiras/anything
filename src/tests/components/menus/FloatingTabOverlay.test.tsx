import React from 'react';
import { Text } from 'react-native';

import { clearOverlayIfCurrent } from '@/components/menus/FloatingTabOverlay';

it('keeps a newer screen overlay when an older screen loses focus', () => {
  const boardOverlay = <Text>Board controls</Text>;
  const folderOverlay = <Text>Folder controls</Text>;

  expect(clearOverlayIfCurrent(folderOverlay, boardOverlay)).toBe(folderOverlay);
  expect(clearOverlayIfCurrent(boardOverlay, boardOverlay)).toBeNull();
});
