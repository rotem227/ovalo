import { useState, useMemo } from 'react';

import Store from './index';

export default function useSegment( key, group ) {
    const { state: initialState, dispatch, actions, register } = Store.useSegment( key, group );
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