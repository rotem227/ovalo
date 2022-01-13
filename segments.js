const isObject = ( value ) => {
  return value !== null && typeof value === 'object' && Array.isArray( value ) === false;
}

const groups = {};

export default class Segments {
    static useSegment( key, group = 'default' ) {
        return groups[ group ].useSegment( key );
    }

    static init( config, group = 'default' ) {        
        groups[ group ] = new Segment( config, group );

        return groups[ group ];
    }
}

class Segment {
    isInitialized = false;

    group = '';

    stack = {};

    state = {};

    registeredCount = 0;
    
    register( key, callback ) {
        if ( 'function' !== typeof callback ) {
            return new Error( 'The registered callback must be a function.' );
        }

        if ( ! this.stack.hasOwnProperty( key ) ) {
            this.stack[ key ] = {};
        }

        const registeredNumber = this.registeredCount;

        const register = () => this.stack[ key ][ registeredNumber ] = callback;;
        const unregister = () => delete this.stack[ key ][ registeredNumber ];

        register();

        this.registeredCount++;

        return {
            restore: register,
            unregister,
        }
    }

    updateState( key, value ) {
        return new Promise( async ( res ) => {
            if ( 'function' === typeof value ) {
                const stateValue = this.state[ key ].state;
                const prevState = isObject( stateValue ) ? { ...stateValue } : stateValue;

                value = value( prevState );
                
                return res( this.updateState( key, value ) );
            } else if ( value instanceof Promise ) {
                value = await value;

                return res( this.updateState( key, value ) );
            }

            this.state[ key ].state = value;

            Object.values( this.stack[ key ] ).forEach( ( callback ) => callback( value ) );

            res( value );
        } );
    }

    async runSequence( key, sequence ) {
        for ( const callback of sequence ) {
            await this.updateState( key, callback );
        }
    }

    dispatch( key, value ) {
        if ( Array.isArray( value ) ) {
            this.runSequence( key, value );
        } else {
            this.updateState( key, value );
        }
    }
    
    useSegment( key ) {
        const prop = this.state[ key ];

        if ( ! prop.hasOwnProperty( 'state' ) ) {
            throw new Error( `Missing segment name: '${ key }' in the segments config.` );
        }

        return {
            state: isObject( prop.state ) ? { ...prop.state } : prop.state,
            actions: isObject( prop.actions ) ? { ...prop.actions } : prop.actions,
            dispatch: ( value ) => this.dispatch( key, value ),
            register: ( callback ) => this.register( key, callback ),
        };
    }

    constructor( config, group ) {
        this.isInitialized = true;

        this.group = group;

        this.state = config;
    }
}