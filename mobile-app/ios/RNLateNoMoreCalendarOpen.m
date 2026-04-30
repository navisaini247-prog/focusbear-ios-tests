#import <React/RCTBridgeModule.h>
#import <UIKit/UIKit.h>
#import <EventKit/EventKit.h>

@interface RNLateNoMoreCalendarOpen : NSObject <RCTBridgeModule>
@end

@implementation RNLateNoMoreCalendarOpen

RCT_EXPORT_MODULE(LateNoMoreCalendarOpen);

RCT_EXPORT_METHOD(openLocalEventWithCalendarItemId:(NSString *)calendarItemId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  if (calendarItemId == nil || calendarItemId.length == 0) {
    reject(@"E_INVALID", @"Missing calendar item id", nil);
    return;
  }

  EKEventStore *store = [[EKEventStore alloc] init];
  EKCalendarItem *item = [store calendarItemWithIdentifier:calendarItemId];
  if (![item isKindOfClass:[EKEvent class]]) {
    reject(@"E_NOT_FOUND", @"No calendar event for this id", nil);
    return;
  }

  EKEvent *event = (EKEvent *)item;
  NSString *eventIdentifier = event.eventIdentifier;
  if (eventIdentifier == nil || eventIdentifier.length == 0) {
    reject(@"E_NO_EVENT_IDENTIFIER", @"Event has no eventIdentifier for URL scheme", nil);
    return;
  }

  // Same as Scriptable: "x-apple-calevent://" + identifier.replace(":", "/") (no encoding first).
  NSString *path = [eventIdentifier stringByReplacingOccurrencesOfString:@":" withString:@"/"];
  NSString *urlString = [NSString stringWithFormat:@"x-apple-calevent://%@", path];
  NSURL *url = [NSURL URLWithString:urlString];
  if (url == nil) {
    NSCharacterSet *allowed = [NSCharacterSet URLPathAllowedCharacterSet];
    NSArray<NSString *> *segments = [eventIdentifier componentsSeparatedByString:@":"];
    NSMutableArray<NSString *> *encodedSegments = [NSMutableArray arrayWithCapacity:segments.count];
    for (NSString *segment in segments) {
      NSString *enc = [segment stringByAddingPercentEncodingWithAllowedCharacters:allowed];
      if (enc == nil) {
        reject(@"E_ENCODE", @"Could not encode event identifier segment", nil);
        return;
      }
      [encodedSegments addObject:enc];
    }
    NSString *encodedPath = [encodedSegments componentsJoinedByString:@"/"];
    urlString = [NSString stringWithFormat:@"x-apple-calevent://%@", encodedPath];
    url = [NSURL URLWithString:urlString];
  }
  if (url == nil) {
    reject(@"E_URL", @"Could not build x-apple-calevent URL", nil);
    return;
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    [[UIApplication sharedApplication]
        openURL:url
        options:@{}
        completionHandler:^(BOOL success) {
          if (success) {
            resolve(@YES);
          } else {
            reject(@"E_OPEN", @"UIApplication openURL completed with success=NO", nil);
          }
        }];
  });
}

@end
