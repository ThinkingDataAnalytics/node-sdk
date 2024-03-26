
declare class TDTrackEvent {
    // event name
    event: string;
    // account ID. Distinct ID and account ID cannot be both empty
    accountId?: string;
    // distinct ID. Distinct ID and account ID cannot be both empty
    distinctId?: string;
    // custom time: Date()
    time?: Date;
    // custom ip
    ip?: string;
    // custom properties
    properties?: object;
    // callback error
    callback?: Function;
}
declare class TDTrackFirstEvent extends TDTrackEvent {
    firstCheckId: string;
}
declare class TDTrackUpdateEvent extends TDTrackEvent {
    eventId: string;
}
declare class TDTrackOverwriteEvent extends TDTrackEvent {
    eventId: string;
}

declare class TDUserProfileEvent {
    // account ID. Distinct ID and account ID cannot be both empty
    accountId?: string;
    // distinct ID. Distinct ID and account ID cannot be both empty
    distinctId?: string;
    // custom properties
    properties?: object;
    // callback error
    callback?: Function;
}

declare class TDUserUnsetEvent {
    // account ID. Distinct ID and account ID cannot be both empty
    accountId?: string;
    // distinct ID. Distinct ID and account ID cannot be both empty
    distinctId?: string;
    // unset property
    property: string;
    // callback error
    callback?: Function;
}

declare class TDAnalytics {
    /**
     * Report ordinary event.
     * @param params
     * @param skipLocalCheck
     */
    track(params: TDTrackEvent, skipLocalCheck?: boolean): void;

    /**
     * Report updatable event.
     * @param params
     * @param skipLocalCheck
     */
    trackUpdate(params: TDTrackUpdateEvent, skipLocalCheck?: boolean): void;

    /**
     * Report overridable event.
     * @param params
     * @param skipLocalCheck
     */
    trackOverWrite(params: TDTrackOverwriteEvent, skipLocalCheck?: boolean): void;

    /**
     * Report first event.
     * @param params
     * @param skipLocalCheck
     */
    trackFirst(params: TDTrackFirstEvent, skipLocalCheck?: boolean): void;

    /**
     * Set user properties. would overwrite existing names
     * @param params
     */
    userSet(params: TDUserProfileEvent): void;

    /**
     * Set user properties, If such property had been set before, this message would be neglected
     * @param params
     */
    userSetOnce(params: TDUserProfileEvent): void;

    /**
     * Clear the user properties of users
     * @param params
     */
    userUnset(params: TDUserUnsetEvent): void;

    /**
     * To accumulate operations against the property.
     * @param params
     */
    userAdd(params: TDUserProfileEvent): void;

    /**
     * To add user properties of array type
     * @param params
     */
    userAppend(params: TDUserProfileEvent): void;

    /**
     * Append user properties to array type by unique.
     * @param params
     */
    userUniqAppend(params: TDUserProfileEvent): void;

    /**
     * Delete a user
     * @param params
     */
    userDel(params: TDUserProfileEvent): void;

    /**
     * Set common properties
     * @param superProperties
     * @param callback
     */
    setSuperProperties(superProperties: Object, callback?: Function): void;

    /**
     * Clear common properties
     */
    clearSuperProperties(): void;

    /**
     * Set dynamic common properties, It has a higher priority than common properties
     * @param getDynamicProperties
     * @param callback
     */
    setDynamicSuperProperties(getDynamicProperties: Function, callback?: Function): void;

    /**
     * Report data immediately. it is available on BatchMode.
     * @param callback
     */
    flush(callback?: Function): void;

    /**
     * Close and exit SDK.
     */
    close(): void;
}

declare class TDLogConsumerConfig {
    // false(default) by the day; true by the hour.
    rotateHourly?: boolean;
    // file prefix
    filePrefix?: string;
}

declare class TDBatchConsumerConfig {
    // flush event count each time, default 20
    batchSize?: number;
    // enable http compress
    compress?: boolean;
}

declare class TDDebugConsumerConfig {
    // you could set dryRun if you want check data only and don't report data to TE
    dryRun: boolean;
    // debug device id
    deviceId: string;
}

/**
 * The data is reported one by one, and when an error occurs, the log will be printed on the console
 *
 * @param appId appId in your project
 * @param serverUrl receiver url in your project
 * @param config config of consumer
 * @return ThinkingDataAnalytics SDK instance
 */
declare function initWithDebugMode(appId: string, serverUrl: string, config: TDDebugConsumerConfig): TDAnalytics;

/**
 * Upload data to TE by http
 *
 * @param appId appId in your project
 * @param serverUrl receiver url in your project
 * @param config config of consumer
 * @return ThinkingDataAnalytics SDK instance
 */
declare function initWithBatchMode(appId: string, serverUrl: string, config: TDBatchConsumerConfig): TDAnalytics;

/**
 * Upload data to TE async by http
 *
 * @param appId appId in your project
 * @param serverUrl receiver url in your project
 * @param config config of consumer
 * @return ThinkingDataAnalytics SDK instance
 */
declare function initWithAsyncBatchMode(appId: string, serverUrl: string, config: TDBatchConsumerConfig): TDAnalytics;

/**
 * Write data to file, it works with LogBus
 * The Logging Mode uses winston to save data, you need to report data by LogBus.
 *
 * @param path log file's directory
 * @param config config of consumer
 */
declare function initWithLoggingMode(path: string, config: TDLogConsumerConfig): TDAnalytics;

/**
 * Enable SDK log
 * @param enable
 */
declare function enableLog(enable: boolean): void;

export {
    initWithDebugMode,
    initWithBatchMode,
    initWithAsyncBatchMode,
    initWithLoggingMode,
    enableLog
}


