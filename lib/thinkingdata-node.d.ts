
declare class TA {
    track(params: Object, skipLocalCheck?: boolean): void;
    trackUpdate(params: Object, skipLocalCheck?: boolean): void;
    trackOverWrite(params: Object, skipLocalCheck?: boolean): void;
    trackFirst(params: Object, skipLocalCheck?: boolean): void;
    userSet(params: Object): void;
    userSetOnce(params: Object): void;
    userUnset(params: Object): void;
    userAdd(params: Object): void;
    userAppend(params: Object): void;
    userUniqAppend(params: Object): void;
    userDel(params: Object): void;
    setSuperProperties(superProperties: Object, callback?: Function): void;
    clearSuperProperties(): void;
    setDynamicSuperProperties(getDynamicProperties: Function, callback?: Function): void;
    flush(callback?: Function): void;
    close(): void;
}

declare class LogConsumerConfig {
    // false(default) by the day; true by the hour.
    rotateHourly?: boolean;

    // file prefix
    filePrefix?: string;

    // This parameter must be set to true if the app runs in a pm2 environment
    pm2?: boolean;

    // Usually you don't need to set it.
    // You need to set this parameter, If you add the 'instance_var' in the pm2 configuration file.
    pm2InstanceVar?: string;
}

declare function initWithDebugMode(appId: string, serverUrl: string, config: Object): TA;
declare function initWithBatchMode(appId: string, serverUrl: string, config: Object): TA;
declare function initWithAsyncBatchMode(appId: string, serverUrl: string, config: Object): TA;
declare function initWithLoggingMode(path: string, config: LogConsumerConfig, log4jsConfig?: Object): TA;

export {
    initWithDebugMode,
    initWithBatchMode,
    initWithAsyncBatchMode,
    initWithLoggingMode
}


