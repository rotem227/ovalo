const isObject = ( value ) => {
  return value !== null && typeof value === 'object' && Array.isArray( value ) === false;
}

const stores = {};

export default class Store {
    static use( key, name = 'default' ) {
        return stores[ name ].use( key );
    }

    static init( config, name = 'default' ) {        
        stores[ name ] = new StoreInstance( config, name );

        return stores[ name ];
    }
}

class StoreInstance {
    isInitialized = false;

    name = '';

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
    
    use( key ) {
        const prop = this.state[ key ];

        return {
            state: isObject( prop.state ) ? { ...prop.state } : prop.state,
            actions: isObject( prop.actions ) ? { ...prop.actions } : prop.actions,
            dispatch: ( value ) => this.dispatch( key, value ),
            register: ( callback ) => this.register( key, callback ),
        };
    }

    constructor( config, name ) {
        this.isInitialized = true;

        this.name = name;

        this.state = config;
    }
}