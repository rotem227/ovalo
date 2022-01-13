import { default as useSegmentHook } from './use-segment';
import { default as useInitSegmentsHook } from './use-init-segments';
import Segments from './segments';

export const useSegment = useSegmentHook;
export const useInitSegments = useInitSegmentsHook;

export default Segments;

window.ovalo = {
    segments: Segments,
};