import React, { useMemo } from 'react';

import Store from './index';

export default function useInitStore( config, name ) {
    const store = useMemo( () => Store.init( config, name ), [] );

    return {
        store,
    };
}