#import "ExceptionlessReactNative.h"
#import "ExceptionlessCrashReporter.h"

@implementation ExceptionlessReactNative

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup {
    return NO;
}

RCT_EXPORT_METHOD(install) {
    [[ExceptionlessCrashReporter sharedInstance] install];
}

RCT_EXPORT_METHOD(hasPendingCrashReport:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    BOOL hasPending = [[ExceptionlessCrashReporter sharedInstance] hasPendingCrashReport];
    resolve(@(hasPending));
}

RCT_EXPORT_METHOD(getPendingCrashReports:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    @try {
        NSArray<NSDictionary *> *reports = [[ExceptionlessCrashReporter sharedInstance] getPendingCrashReports];
        resolve(reports);
    } @catch (NSException *exception) {
        reject(@"crash_report_error",
               [NSString stringWithFormat:@"Failed to get crash reports: %@", exception.reason],
               nil);
    }
}

RCT_EXPORT_METHOD(clearPendingCrashReports:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    [[ExceptionlessCrashReporter sharedInstance] clearPendingCrashReports];
    resolve(nil);
}

@end
