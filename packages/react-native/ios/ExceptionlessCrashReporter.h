#import <Foundation/Foundation.h>

@interface ExceptionlessCrashReporter : NSObject

+ (instancetype)sharedInstance;

- (void)install;
- (BOOL)hasPendingCrashReport;
- (NSArray<NSDictionary *> *)getPendingCrashReports;
- (void)clearPendingCrashReports;

@end
