import { useState, useMemo } from 'react';

import Store from './index';

export default function useSegment( key, name ) {
    const { state: initialState, dispatch, actions, register } = Store.use( key, name );
    const [ state, setState ] = useState( () => initialState );
    const { unregister, restore } = useMemo( () => register( setState ), [] );

    return {
        state,
        dispatch,
        actions,
        restore,
        unregister,
    };
}