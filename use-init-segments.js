import React, { useMemo } from 'react';

import Segments from './index';

export default function useInitSegments( config, group ) {
    const segments = useMemo( () => Segments.init( config, group ), [] );

    return {
        segments,
    };
}