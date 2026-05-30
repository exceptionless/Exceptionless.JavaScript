#import "ExceptionlessCrashReporter.h"
#import <CrashReporter/CrashReporter.h>
#import <sys/utsname.h>

@interface ExceptionlessCrashReporter ()
@property (nonatomic, strong) PLCrashReporter *crashReporter;
@end

@implementation ExceptionlessCrashReporter

+ (instancetype)sharedInstance {
    static ExceptionlessCrashReporter *instance = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        instance = [[ExceptionlessCrashReporter alloc] init];
    });
    return instance;
}

- (instancetype)init {
    self = [super init];
    if (self) {
        PLCrashReporterConfig *config = [[PLCrashReporterConfig alloc]
            initWithSignalHandlerType:PLCrashReporterSignalHandlerTypeMach
            symbolicationStrategy:PLCrashReporterSymbolicationStrategyAll];
        _crashReporter = [[PLCrashReporter alloc] initWithConfiguration:config];
    }
    return self;
}

- (void)install {
    NSError *error = nil;
    if (![self.crashReporter enableCrashReporterAndReturnError:&error]) {
        if ([error.domain isEqualToString:PLCrashReporterErrorDomain] && error.code == PLCrashReporterErrorResourceBusy) {
            return;
        }

        NSLog(@"[Exceptionless] Failed to enable crash reporter: %@", error);
    }
}

- (BOOL)hasPendingCrashReport {
    return [self.crashReporter hasPendingCrashReport];
}

- (NSArray<NSDictionary *> *)getPendingCrashReports {
    if (![self.crashReporter hasPendingCrashReport]) {
        return @[];
    }

    NSError *error = nil;
    NSData *crashData = [self.crashReporter loadPendingCrashReportDataAndReturnError:&error];
    if (crashData == nil) {
        NSLog(@"[Exceptionless] Failed to load crash report: %@", error);
        return @[];
    }

    PLCrashReport *report = [[PLCrashReport alloc] initWithData:crashData error:&error];
    if (report == nil) {
        NSLog(@"[Exceptionless] Failed to parse crash report: %@", error);
        return @[];
    }

    NSDictionary *parsedReport = [self parseCrashReport:report];
    return parsedReport ? @[parsedReport] : @[];
}

- (void)clearPendingCrashReports {
    [self.crashReporter purgePendingCrashReport];
}

#pragma mark - Crash Report Parsing

- (NSDictionary *)parseCrashReport:(PLCrashReport *)report {
    NSMutableDictionary *result = [NSMutableDictionary dictionary];

    // Timestamp
    if (report.systemInfo.timestamp) {
        NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
        formatter.dateFormat = @"yyyy-MM-dd'T'HH:mm:ss'Z'";
        formatter.timeZone = [NSTimeZone timeZoneWithName:@"UTC"];
        result[@"timestamp"] = [formatter stringFromDate:report.systemInfo.timestamp];
    }

    // Signal info
    if (report.signalInfo) {
        result[@"signal_name"] = report.signalInfo.name ?: [NSNull null];
        result[@"signal_code"] = report.signalInfo.code ?: [NSNull null];
    }

    // Exception info
    if (report.hasExceptionInfo) {
        result[@"exception_type"] = @"NSException";
        result[@"exception_name"] = report.exceptionInfo.exceptionName ?: [NSNull null];
        result[@"exception_reason"] = report.exceptionInfo.exceptionReason ?: [NSNull null];
    } else {
        result[@"exception_type"] = [NSNull null];
        result[@"exception_name"] = [NSNull null];
        result[@"exception_reason"] = [NSNull null];
    }

    // Crashed thread
    NSInteger crashedThreadIndex = 0;
    for (NSInteger i = 0; i < report.threads.count; i++) {
        PLCrashReportThreadInfo *thread = report.threads[i];
        if (thread.crashed) {
            crashedThreadIndex = i;
            break;
        }
    }
    result[@"crashed_thread"] = @(crashedThreadIndex);

    // Threads
    NSMutableArray *threads = [NSMutableArray array];
    for (PLCrashReportThreadInfo *thread in report.threads) {
        NSMutableArray *frames = [NSMutableArray array];
        for (PLCrashReportStackFrameInfo *frame in thread.stackFrames) {
            NSMutableDictionary *frameDict = [NSMutableDictionary dictionary];
            frameDict[@"address"] = [NSString stringWithFormat:@"0x%llx", frame.instructionPointer];

            if (frame.symbolInfo) {
                frameDict[@"symbol"] = frame.symbolInfo.symbolName ?: [NSNull null];
                frameDict[@"offset"] = @(frame.instructionPointer - frame.symbolInfo.startAddress);
            } else {
                frameDict[@"symbol"] = [NSNull null];
                frameDict[@"offset"] = [NSNull null];
            }

            // Find matching binary image for this frame
            frameDict[@"image"] = [NSNull null];
            for (PLCrashReportBinaryImageInfo *imageInfo in report.images) {
                uint64_t imageStart = imageInfo.imageBaseAddress;
                uint64_t imageEnd = imageStart + imageInfo.imageSize;
                if (frame.instructionPointer >= imageStart && frame.instructionPointer < imageEnd) {
                    frameDict[@"image"] = imageInfo.imageName ?: [NSNull null];
                    break;
                }
            }

            [frames addObject:frameDict];
        }

        [threads addObject:@{
            @"thread_id": @(thread.threadNumber),
            @"crashed": @(thread.crashed),
            @"frames": frames
        }];
    }
    result[@"threads"] = threads;

    // Device info
    struct utsname systemInfo;
    uname(&systemInfo);
    NSString *model = [NSString stringWithCString:systemInfo.machine encoding:NSUTF8StringEncoding];

    NSString *osVersion = report.systemInfo.operatingSystemVersion ?: @"unknown";

    NSString *appVersion = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleShortVersionString"];

    result[@"device"] = @{
        @"model": model ?: @"unknown",
        @"os_version": osVersion,
        @"app_version": appVersion ?: [NSNull null]
    };

    return result;
}

@end
