const isObject = ( value ) => {
  return value !== null && typeof value === 'object' && Array.isArray( value ) === false;
}

const cloneValue = ( value ) => {
    if ( Array.isArray( value ) ) {
        return [ ...value ];
    } else if ( isObject( value ) ) {
        return { ...value };
    }

    return value;
}

export default class Segments {
    static groups = {};

    static add( key, value, group = 'default' ) {
        if ( this.groups[ group ].state.hasOwnProperty( key ) ) {
            throw new Error( 'Segment key is already exist, please use a different key.' );
        }
        
        this.groups[ group ].state[ key ] = value;
    }
    
    static use( key, group = 'default' ) {
        return this.groups[ group ].use( key );
    }

    static init( config, group = 'default' ) {        
        this.groups[ group ] = new Group( config, group );

        return this.groups[ group ];
    }
}

class Group {
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

                const prevState = cloneValue( stateValue );

                value = value( prevState );
                
                return res( this.updateState( key, value ) );
            } else if ( value instanceof Promise ) {
                value = await value;

                return res( this.updateState( key, value ) );
            }

            this.state[ key ].state = value;

            if ( this.stack[ key ] ) {
                Object.values( this.stack[ key ] ).forEach( ( callback ) => callback( value ) );
            }

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
    
    use( key ) {
        const prop = this.state[ key ];

        if ( ! prop.hasOwnProperty( 'state' ) ) {
            throw new Error( `Missing segment name: '${ key }' in the segments config.` );
        }

        return {
            initialState: cloneValue( prop.state ),
            getState: () => cloneValue( prop.state ),
            actions: cloneValue( prop.actions ),
            dispatch: ( value ) => this.dispatch( key, value ),
            register: ( callback ) => this.register( key, callback ),
        };
    }

    constructor( config, group ) {
        this.isInitialized = true;

        this.name = group;

        this.state = config;
    }
}